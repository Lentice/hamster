# 🐹 鼠鼠小屋

可愛風的寵物鼠養成換裝網頁遊戲。純靜態網頁，電腦、iPad、手機都能直接用瀏覽器玩。

**👉 線上遊玩：https://lentice.github.io/hamster/**

iPad / iPhone 用 Safari 開啟後按「分享 → 加入主畫面」，就能像 App 一樣全螢幕玩。

## 玩法

| 畫面 | 內容 |
|---|---|
| 👗 換裝 | 13 種鼠鼠、21 種表情，加上帽子、衣服、眼鏡、頸飾、手持物、特效、背景。鼠鼠會跟著游標轉頭、做各種小動作。可以取名字、存成 PNG |
| 🏠 我的家 | 最多 5 層樓，每層自由擺放家具（拖曳、翻轉、縮放、收起）、換房間背景，用梯子上下樓。鼠鼠會自己走動、跑滾輪、吃飯、睡覺、鑽隧道；也可以切換成自己操控 |
| 🌳 出門玩 | 公園地圖，方向鍵 / WASD 或點地面移動。撿地上的瓜子賺幣，跟路過的鼠鼠聊天，走到攤位按空白鍵玩小遊戲 |
| 🎮 小遊戲 | 接瓜子、滾輪衝刺、翻牌配對、打地鼠、跳跳跑酷、迷宮找瓜子，依分數獲得鼠鼠幣 |
| 🛒 商店 | 用鼠鼠幣買特別的衣服、配件、背景、家具、房間 |
| 🌐 一起玩 | 公園裡看到其他玩家的鼠鼠，聊天（快速短句或打字，會過濾髒話、網址和電話）、做表情動作。可以進公開公園，或開朋友房間分享代碼／邀請連結。點別的玩家可以封鎖（需要先設定 Firebase，見下方） |

鼠鼠種類：黃金鼠、長毛鼠、布丁鼠、三線鼠、一線鼠、冬白鼠、紫倉鼠、老公公鼠、老婆婆鼠、熊熊鼠、三色天竺鼠、泰迪天竺鼠、阿比天竺鼠。每種的體型大小、身形比例、毛的外形（平滑／蓬蓬／刺刺）、耳朵都不同。

進度（鼠鼠幣、買過的東西、搭配、房間擺設）都存在瀏覽器的 localStorage。

## 本機執行

需要用本機伺服器開啟（存圖和小遊戲會讀取圖片素材）：

```bash
python -m http.server 8000
# 打開 http://localhost:8000
```

## 多人連線（Firebase）

多人功能用 Firebase 匿名登入 + Realtime Database，免費方案就夠用。沒有設定時遊戲照常是單人模式。

1. 到 [Firebase 主控台](https://console.firebase.google.com/) 建立專案（Google Analytics 可以關掉）
2. **Build → Authentication → 開始使用 → Sign-in method**，啟用「匿名」
3. **Build → Realtime Database → 建立資料庫**，位置選 `asia-southeast1`（新加坡），以「鎖定模式」開始
4. 在 Realtime Database 的 **規則** 分頁，貼上 `firebase/database.rules.json` 的內容後發布
5. **專案設定 → 一般 → 你的應用程式**，新增網頁應用程式（`</>`），把產生的 `firebaseConfig` 物件貼到 `js/net-config.js`：
   ```js
   window.FIREBASE_CONFIG = { apiKey: '...', authDomain: '...', databaseURL: 'https://....firebasedatabase.app', projectId: '...', appId: '...' };
   ```
6. Authentication → 設定 → 已授權網域，加入 `<帳號>.github.io`

這些設定值會公開在網頁上是正常的，資料安全靠規則：只能改自己的鼠鼠、位置要在地圖內、名字和訊息有長度限制、聊天每 1.5 秒最多一則、不能列出所有房間，超過 10 分鐘的舊訊息會被清掉。

本機測試可以用 Firebase 模擬器（需要 Java）：

```bash
cd firebase && npx firebase-tools@13.29.0 emulators:start --project demo-hamster --only auth,database
# 載入規則
curl -X PUT "http://127.0.0.1:9000/.settings/rules.json?ns=demo-hamster" -H "Authorization: Bearer owner" --data-binary @database.rules.json
# 開兩個瀏覽器到 http://localhost:8000/?emu=1
```

## 發布到 GitHub Pages

1. 在 GitHub 建立 repository，推上這個資料夾（`.gitignore` 已排除原始大圖）
   - 更新程式後，把 `index.html` 裡的 `?v=9` 版本號加一，玩家的瀏覽器才會抓新版
2. **Settings → Pages → Source** 選 `Deploy from a branch`，Branch 選 `main`、資料夾 `/ (root)`
3. 約一分鐘後就能在 `https://<帳號>.github.io/<repository>/` 遊玩

## 檔案結構

```
index.html            頁面骨架
css/style.css         樣式與所有動畫
js/svg.js             SVG 繪圖工具、素材載入
js/pets.js            鼠鼠物種（體型參數）與表情
js/items.js           衣服、帽子、眼鏡、頸飾、手持、特效、背景、家具、房間
js/look.js            把一套搭配組成 SVG
js/store.js           存檔、鼠鼠幣、購買
js/ui.js              音效、彈窗、提示、畫面切換
js/wardrobe.js        換裝畫面
js/shop.js            商店
js/home.js            我的家（佈置 + 鼠鼠 AI）
js/outdoor.js         公園地圖
js/net-config.js      Firebase 設定（多人連線）
js/net.js             多人連線底層（登入、房間、位置、聊天）
js/online.js          公園的多人介面（其他玩家、聊天、表情、房間、封鎖）
firebase/             資料庫安全規則與模擬器設定
js/games.js           小遊戲（接瓜子、滾輪、翻牌）
js/games-more.js      小遊戲（打地鼠、跑酷、迷宮）
assets/*.webp         點陣素材（由 Codex 生成後處理）
assets/manifest.js    素材尺寸（自動產生）
tools/process_assets.py  素材處理腳本
```

## 美術分工

- **SVG（程式繪製）**：鼠鼠身體、表情、衣服、大部分配件。這樣才能做眨眼、走路、耳朵抖動等動畫，衣服也能自動裁成每種鼠鼠的身形。
- **點陣圖（Codex 生成）**：房間、公園道具、家具、高級貼紙配件、背景、小遊戲道具。

新增點陣素材：把透明背景 PNG 放進 `assets/raw/`，執行 `python tools/process_assets.py`，會自動裁邊、縮圖、轉 WebP 並更新尺寸清單。

## 新增服裝或配件

在 `js/items.js` 對應的清單加入一個物件即可，畫布為 400×400：

```js
{ id: 'cap', name: '棒球帽', price: 80, render: () => `<path d="..." fill="#5C8FE6" ${SW}/>` },
// 點陣貼紙：以寬度 w、底部中心 (cx, bottom) 擺放
{ id: 'r_cake', name: '蛋糕帽', price: 180, img: 'hat_cupcake', place: { w: 170, bottom: 176 } },
```

- 以標準倉鼠為基準：雙眼 (165,225)、(235,225)，鼻子 (200,246)，脖子約 y=288，雙手 (172,302)、(228,302)，頭頂 y=146
- 每種鼠鼠的頭頂高度不同，上半身部件會自動平移；`price` 有值就會出現在商店
- 衣服的 `clipped` 會被裁成身體形狀；`front` 畫在身體上不裁切；`back` 畫在身體後方（披風、翅膀、帽兜）
