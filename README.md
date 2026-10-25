# TOP GUN — STORIES BEYOND THE SKY

SAKURAI_TK 的非官方 Top Gun 同人作品總入口。**獨立新網站，不取代任何既有網站**。

## 內容架構

| 入口 | 來源 | 網站行為 |
|---|---|---|
| Song Maketh Wingman | Notion 「我的作品」的 `作品識別碼=song_maketh_wingman` | 獨立短篇目錄、CP 篩選、18+ 提醒、章節閱讀 |
| 隨寫系列 | `作品識別碼=top_gun_random_writings` | `故事篇章` 依 IceMav合集／RooHang合集／IceMav和RooHang合集 三組獨立顯示 |
| Where Wake Turbulence Ends | 既有網站 | 專屬卡片、外連 `https://turbulence-eim.pages.dev/` |
| 時空交錯的旅行 | 獨立作品 | 專屬卡片；直接外連 `https://globetrotting.pages.dev/` |

### 視覺

D 方案：夕陽航空電影感首頁 + 深海軍藍航空檔案卡片 + 暖白閱讀頁。
目前的背景和卡片圖片是從**AI 生成的航空風景概念圖**裁切（不含電影角色與標誌），不是從第三方付費圖庫購買，也**不是官方電影劇照**。請勿對外宣稱與《Top Gun》官方有關。個別文字、商標和人物肖像仍需遵守權利限制。

## 預覽

在專案根目錄執行：

```bash
python3 -m http.server 8000
```

打開 `http://localhost:8000`。不要直接雙擊 `index.html` 開啟，因為瀏覽器可能阻擋對本機 JSON 的讀取。

初始 `data/chapters.json` 是空陣列，不含私人文章；因此在完成 Notion 同步前，公開目錄會顯示「尚無公開文章」。

## GitHub + Notion 串接

1. 建立**新的** GitHub repository，例如 `top-gun-archive`。不要覆蓋先前的三個專案。
2. 將整個 ZIP **解壓縮後**的根目錄檔案上傳。務必保留 `.github/workflows/sync-notion.yml` 和 `scripts/sync_notion.py`。
3. 前往新 repository 的 `Settings → Secrets and variables → Actions`，新增：
   - `NOTION_TOKEN`：沿用既有的唯讀 Notion Integration Token。
   - `NOTION_DATABASE_ID`：目前「📖 章節資料庫」的**真實資料庫 ID**，之前在 Love Casting 驗證可用的那個。不要複製檢視 View ID。
4. **同一個 Notion Integration** 必須能讀取「📖 章節資料庫」與「📚 我的作品」。只勾選 Read content 即可，不用提供修改權限。
5. 在「📚 我的作品」中確認這兩筆紀錄的 `作品識別碼` 文字欄位：
   - `Song Maketh Wingman`：`song_maketh_wingman`
   - `隨寫系列`：`top_gun_random_writings`
6. 章節必須在「所屬作品」關聯正確的作品頁面。**只有** `發布狀態=已發布` 且 `網站公開=勾選` 的文章會輸出。草稿不會輸出；若尚未準備公開，請維持未勾選。
7. 對隨寫系列，請填好「故事篇章」為 `IceMav合集`、`RooHang合集` 或 `IceMav和RooHang合集`。超出這三組的隨寫文章即使設為公開也不會匯出。
8. 到 `Actions → Sync Top Gun Notion Articles → Run workflow → main` 首次手動同步。日後每天台灣時間上午十時排程同步（GitHub 排程可能延遲）。
9. Action 成功後確認 `data/chapters.json` 的公開故事數量，以及 18+、CP、歌曲外連、五章目錄是否正確。

**不用額外提供每個作品的 Page ID！** 多作品同步程式會讀取章節的「所屬作品」關聯，然後查詢相關作品的 `作品識別碼`。這需要 Integration 有權限讀取「📚 我的作品」。

> 注意： GitHub Actions Logs 不會輸出文章正文。Notion Token 只存在 GitHub Secrets，不可放到 `config.js` 或任何公開檔案。

## Cloudflare Pages 部署

- **Repository**：新建的 Top Gun repository
- **Production branch**：`main`
- **Framework preset**：None
- **Build command**：留空（或 `exit 0`）
- **Build output directory**：`.`

`main` 有新 commit 時 Cloudflare Pages 將重新部署。本網站是靜態網站，沒有另外的伺服器執行環境。

## 修改既有作品連結

在根目錄 `config.js`：

```js
window.TOP_GUN_CONFIG = {
  turbulenceUrl: 'https://turbulence-eim.pages.dev/',
  globetrottingUrl: 'https://globetrotting.pages.dev/',
  author: 'SAKURAI_TK'
};
```

只有公開網址可放在 `config.js`，**不要填入 Token**。

## 特殊閱讀功能

- 18+ 分級會顯示年齡確認視窗。這是提醒，**不是身分驗證**。
- 〈Being normal is a miracle〉：只要五個章節的標題在**同一篇 Notion 頁面**使用 Heading 2 或 Heading 3，且標題類似 `Chapter 1: ...` 到 `Chapter 5: ...`，閱讀器就會產生章節跳轉目錄。
- 指定的 YouTube 配樂：若正文含 YouTube 網址，會在讀者頁面出現「本篇推薦配樂」，開啟 YouTube，不下載或重新發佈歌曲音訊。
- `章節順序` 採用全隨寫系列 1～25 的連續編號，但網站依 `故事篇章` 自動分成三組，**不合併目錄**。

## 專案結構

```text
.github/workflows/sync-notion.yml    GitHub Actions 定時與手動同步
scripts/sync_notion.py              Notion 唯讀公開章節匯出
index.html                          首頁和閱讀器結構
styles.css                          D 版響應式設計
app.js                              作品卡片、合集篩選、閱讀器
config.js                           僅公開的獨立網站網址
data/chapters.json                  生成的公開文章資料
assets/                             AI 概念圖裁切素材
README.md                           使用手冊
```

## 上線前檢查

- [ ] Github Actions 成功完成、輸出只有核准公開的文章
- [ ] Song Maketh Wingman 系列頁正常；18+ 文章有警語
- [ ] 隨寫系列顯示三組獨立目錄、排序無重複、25 篇依實際公開狀態呈現
- [ ] 〈Being normal is a miracle〉同頁五章跳轉正常
- [ ] 有 YouTube 連結的文章顯示配樂入口
- [ ] Where Wake Turbulence Ends 連結正確
- [ ] 《時空交錯的旅行》卡片可外連；目的站網址須另行驗證
- [ ] iPhone / desktop 上版型正常
- [ ] 清楚標示非官方二次創作
