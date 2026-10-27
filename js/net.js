// 多人連線底層：Firebase 匿名登入 + Realtime Database。
// 資料：rooms/<房間>/players/<uid> 每位玩家的位置與搭配（斷線自動刪除）
//       rooms/<房間>/chat/<id>        聊天訊息（超過 10 分鐘的會被清掉）
// 公開公園是 pub1～pub5（人滿就換下一個），朋友房間是 5 碼代碼。
// 網址加 ?emu=1 會連到本機的 Firebase 模擬器（開發測試用）。

const Net = (() => {
  const SDK = 'https://www.gstatic.com/firebasejs/12.19.0/';
  const EMU = new URLSearchParams(location.search).has('emu');
  const ROOM_CAP = 20;
  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let fb = null, loading = null;
  let room = null, me = null, offset = 0;
  let unsubs = [];
  const on = { add: null, change: null, remove: null, chat: null, status: null };

  const available = () => EMU || !!window.FIREBASE_CONFIG;
  const status = (s) => on.status?.(s);
  const now = () => Date.now() + offset;
  const isCode = (s) => new RegExp(`^[${CODE_CHARS}]{5}$`).test(s);
  const newCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

  async function load() {
    const [app, auth, db] = await Promise.all(['app', 'auth', 'database'].map((m) => import(`${SDK}firebase-${m}.js`)));
    const config = EMU
      ? { apiKey: 'demo-key', projectId: 'demo-hamster', databaseURL: 'http://127.0.0.1:9000?ns=demo-hamster' }
      : window.FIREBASE_CONFIG;
    const a = app.initializeApp(config);
    const au = auth.getAuth(a);
    const d = db.getDatabase(a);
    if (EMU) {
      auth.connectAuthEmulator(au, 'http://127.0.0.1:9099', { disableWarnings: true });
      db.connectDatabaseEmulator(d, '127.0.0.1', 9000);
    }
    const cred = await auth.signInAnonymously(au);
    db.onValue(db.ref(d, '.info/serverTimeOffset'), (s) => { offset = s.val() || 0; });
    fb = { ...db, db: d, uid: cred.user.uid };
    // 斷線重連後（例如 iPad 切到背景再回來）重新報到
    db.onValue(db.ref(d, '.info/connected'), (s) => {
      if (!room) return;
      if (s.val()) { announce(); status('on'); } else status('connecting');
    });
    return fb;
  }

  const ensure = () => (loading ||= load().catch((e) => { loading = null; throw e; }));
  const playerRef = () => fb.ref(fb.db, `rooms/${room}/players/${fb.uid}`);

  function announce() {
    const r = playerRef();
    fb.onDisconnect(r).remove();
    return fb.set(r, me);
  }

  async function pickPublic() {
    for (let i = 1; i <= 5; i++) {
      const s = await fb.get(fb.ref(fb.db, `rooms/pub${i}/players`));
      if (s.size < ROOM_CAP || i === 5) return `pub${i}`;
    }
  }

  // 清掉超過 10 分鐘的舊訊息，免得資料庫一直長大
  async function sweepChat() {
    const q = fb.query(fb.ref(fb.db, `rooms/${room}/chat`), fb.orderByChild('t'), fb.endAt(now() - 610000), fb.limitToFirst(40));
    const s = await fb.get(q);
    s.forEach((c) => { fb.remove(c.ref).catch(() => {}); });
  }

  // target：'public' 或 5 碼代碼；info(uid) 回傳 { name, look, x, y }
  async function join(target, info) {
    leave();
    status('connecting');
    await ensure();
    room = target === 'public' ? await pickPublic() : target;
    me = { ...info(fb.uid), emo: '' };
    await announce();
    const players = fb.ref(fb.db, `rooms/${room}/players`);
    const mine = (s) => s.key === fb.uid;
    unsubs.push(
      fb.onChildAdded(players, (s) => { if (!mine(s)) on.add?.(s.key, s.val()); }),
      fb.onChildChanged(players, (s) => { if (!mine(s)) on.change?.(s.key, s.val()); }),
      fb.onChildRemoved(players, (s) => { if (!mine(s)) on.remove?.(s.key); }),
    );
    const since = now() - 120000;
    const chatQ = fb.query(fb.ref(fb.db, `rooms/${room}/chat`), fb.orderByChild('t'), fb.startAt(since), fb.limitToLast(30));
    unsubs.push(fb.onChildAdded(chatQ, (s) => on.chat?.({ id: s.key, ...s.val(), mine: s.val().uid === fb.uid })));
    sweepChat().catch(() => {});
    status('on');
    return room;
  }

  function leave() {
    unsubs.forEach((u) => u());
    unsubs = [];
    if (fb && room) {
      const r = playerRef();
      fb.onDisconnect(r).cancel();
      fb.remove(r).catch(() => {});
    }
    room = null;
    status('off');
  }

  const patch = (data) => {
    if (!room) return;
    Object.assign(me, data);
    fb.update(playerRef(), data).catch(() => {});
  };

  async function chat(text, name) {
    if (!room) return;
    const key = fb.push(fb.ref(fb.db, `rooms/${room}/chat`)).key;
    await fb.update(fb.ref(fb.db, `rooms/${room}`), {
      [`chat/${key}`]: { uid: fb.uid, name, text, t: fb.serverTimestamp() },
      [`players/${fb.uid}/lc`]: fb.serverTimestamp(),
    });
  }

  return {
    on, available, isCode, newCode, join, leave, chat,
    // Party uses the same authenticated connection and synchronized clock.
    partyConnection: () => room && fb ? { fb, room, now, info: me } : null,
    get room() { return room; },
    get uid() { return fb?.uid; },
    move: (x, y) => patch({ x: Math.round(x), y: Math.round(y) }),
    setLook: (name, look) => patch({ name, look }),
    // 加上時間讓同一個動作連做兩次也會觸發
    emote: (k) => patch({ emo: `${k}:${Date.now() % 100000}` }),
  };
})();
