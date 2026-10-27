// Run against the local Auth + Realtime Database emulators only: node tools/party-rules-test.mjs
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:9000';
const room = 'TSTAA';
let checks = 0;
async function user() {
  const r = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({returnSecureToken:true}) });
  assert(r.ok); return r.json();
}
async function request(path, value, token, allowed = true, method = 'PUT') {
  const r = await fetch(`${base}/${path}.json?ns=demo-hamster${token && token !== 'owner' ? '&auth=' + token : ''}`, { method, headers:{'Content-Type':'application/json', ...(token === 'owner' ? {Authorization:'Bearer owner'} : {})}, ...(method === 'GET' ? {} : {body:JSON.stringify(value)}) });
  const body = await r.text();
  assert.equal(r.ok, allowed, `${method} ${path}: ${r.status} ${body}`); checks++; return body;
}
const [a,b] = await Promise.all([user(),user()]);
const look = {species:'golden',expression:'happy',hat:'none',clothes:'none',glasses:'none',neck:'none',held:'none'};
const player = {name:'測試鼠',look,x:500,y:500};
const entry = {...player,score:0,done:0,active:true};
const root = `rooms/${room}/party/current`;
try {
  await request(`rooms/${room}`, null, 'owner');
  await request(`rooms/${room}/players/${a.localId}`, player, a.idToken);
  await request(`rooms/${room}/players/${b.localId}`, player, b.idToken);
  const meta = {id:crypto.randomUUID(),host:a.localId,name:'測試鼠',kind:'seeds',seed:123,t:{'.sv':'timestamp'}};
  await request(root,{meta},a.idToken);
  await request(root,null,undefined,false,'GET');
  await request(`${root}/players/${a.localId}`,entry,a.idToken);
  await request(`${root}/players/${b.localId}`,entry,b.idToken);
  await request(`${root}/players/${b.localId}/score`,3,a.idToken,false);
  for (const score of [-1,101,1.5,'10']) await request(`${root}/players/${a.localId}/score`,score,a.idToken,false);
  await request(`${root}/players/${a.localId}/x`,1001,a.idToken,false);
  await request(`${root}/players/${a.localId}/done`,25001,a.idToken,false);
  await request(`${root}/players/${a.localId}/score`,2,a.idToken,false);
  await request(`${root}/meta/seed`,999,a.idToken,false);
  await request(`${root}/meta/name`,'x',a.idToken,false);
  await request(root,null,a.idToken,false);
  await request('rooms/WRONG0/party/current',{meta},a.idToken,false);
  await request(`${root}/claims/0`,a.localId,a.idToken,false);
  await request(`${root}/players/${a.localId}/surprise`,1,a.idToken,false);
  await request(`${root}/players/${a.localId}/look/hat`,'x'.repeat(25),a.idToken,false);
  // Real lobby time, no clock mocking for normal joining and claims.
  await new Promise(r=>setTimeout(r,10200));
  await request(`${root}/players/${a.localId}/score`,24,a.idToken);
  await request(`${root}/claims/0`,a.localId,a.idToken);
  await request(`${root}/claims/0`,b.localId,b.idToken,false);
  await request(`${root}/claims/0`,a.localId,a.idToken,false);
  await request(`${root}/claims/0`,null,a.idToken,false);
  await request(`${root}/claims/24`,a.localId,a.idToken,false);
  await request(`${root}/players/${a.localId}`,null,a.idToken,false);
  // Admin fixture ages the round to verify stale cleanup and frozen scores.
  await request(`${root}/meta/t`,Date.now()-46000,'owner');
  await request(`${root}/players/${a.localId}/score`,25,a.idToken,false);
  await request(`${root}/players/${a.localId}/active`,false,a.idToken);
  await request(root,{meta},a.idToken);
  await request(`${root}/players/${a.localId}`,entry,a.idToken);
  console.log(`PASS: ${checks} emulator rules checks (normal writes, auth, ownership, bounds, immutable metadata, claim replay/deletion, wrong rooms, late scores, stale replacement).`);
} finally { await request(`rooms/${room}`,null,'owner'); }
