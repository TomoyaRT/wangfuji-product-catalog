# 汪福記商品選取工具 — 設計規格

**日期**：2026-06-27
**部署目標**：GitHub Pages `https://TomoyaRT.github.io/wangfuji-product-catalog/`

---

## 1. 專案概述

一個行動優先的靜態網頁工具，讓使用者透過手機（iPhone Safari）點選汪福記的商品項目，最終將選取結果輸出為純文字並一鍵複製，用於快速整理訂貨清單。

**核心使用流程**：
1. 展開種類 → 點選子項目（可多選，再次點選取消）
2. 點擊「完成」→ 自動複製 + 顯示回饋 + 捲動到輸出區
3. 輸出區顯示結果文字，可手動編輯或再次複製

---

## 2. 技術堆疊

| 項目 | 選擇 |
|------|------|
| 框架 | React（最新穩定 LTS）|
| 建構工具 | Vite（最新穩定 LTS）|
| 狀態管理 | Zustand（最新穩定 LTS）|
| 樣式 | Tailwind CSS（最新穩定 LTS）|
| 語言 | TypeScript |
| 部署 | GitHub Pages（`gh-pages` branch via GitHub Actions）|

**Vite 設定**：`base: '/wangfuji-product-catalog/'`

---

## 3. 架構

```
src/
├── data/
│   └── products.ts          # 商品資料（hardcoded）
├── store/
│   └── useStore.ts          # Zustand global store
├── components/
│   ├── Header/
│   ├── CategoryList/
│   │   ├── CategoryRow.tsx  # 可展開種類列
│   │   └── ItemChip.tsx     # 可點選子項目
│   ├── ActionBar/           # 固定底部四按鈕
│   ├── OutputArea/          # textarea + 複製按鈕
│   ├── HistoryModal/        # 歷史紀錄彈窗
│   └── FeedbackToast/       # 複製回饋訊息
└── utils/
    ├── clipboard.ts
    └── localStorage.ts
```

---

## 4. 商品資料結構

```typescript
interface Category {
  id: number    // 1, 2, 3...
  name: string  // "梅子類"
  items: Item[]
}

interface Item {
  id: number    // catId * 1000 + index（e.g. 1001, 1002）
  name: string  // "甘宋梅"
}
```

### 種類與 ID 對照表

| Cat ID | 種類名稱 | 項目數量 | ID 範圍 |
|--------|---------|---------|---------|
| 1 | 梅子類 | 26 項 | 1001–1026 |
| 2 | 果、干類 | 47 項 | 2001–2047 |
| 3 | 李、棗類 | 6 項 | 3001–3006 |
| 4 | 橄欖、仙楂類 | 10 項 | 4001–4010 |
| 5 | 魚類 | 21 項 | 5001–5021 |
| 6 | 其他 | 7 項 | 6001–6007 |
| 7 | 豆干類 | 6 項 | 7001–7006 |
| 8 | 糖果類 | 16 項 | 8001–8016 |
| 9 | 未分類 | 4 項 | 9001–9004 |

共 9 個種類，143 個子項目。

---

## 5. Zustand Store

```typescript
interface HistoryEntry {
  id: string          // timestamp string（唯一 key）
  text: string        // "甘宋梅、紅肉甘宋梅、紅心芭樂乾"
  selectedIds: number[] // 還原選取狀態用
  createdAt: string   // 顯示用，e.g. "2026/06/27 14:30"
}

interface Store {
  // 選取狀態
  selectedIds: Set<number>
  expandedCategoryIds: Set<number>
  isAllExpanded: boolean

  // 輸出區
  textareaContent: string   // 手動編輯不回寫選取區

  // 歷史紀錄（localStorage，最多 5 筆，超過清除最舊）
  history: HistoryEntry[]

  // UI 狀態
  isHistoryModalOpen: boolean
  feedbackMessage: string | null  // 2 秒後自動消失

  // Actions
  toggleItem(id: number): void
  toggleCategory(id: number): void
  toggleExpandAll(): void
  finalize(): void              // 完成：生成文字 → 複製 → 存歷史 → 更新 textarea
  clear(): void                 // 清除：重置選取 + 清空 textarea
  loadHistory(entry: HistoryEntry): void  // 還原選取 + 覆寫 textarea + 複製 + 回饋
  copyTextarea(): void          // 複製 textarea 內容 + 回饋
  setTextareaContent(v: string): void    // 使用者手動編輯，不回寫選取區
  openHistoryModal(): void
  closeHistoryModal(): void
  dismissFeedback(): void
}
```

---

## 6. 關鍵同步規則

| 操作 | 選取區狀態 | textarea 內容 |
|------|-----------|--------------|
| 點選 / 取消子項目 | 更新 | 不動 |
| 點擊「完成」| 不動 | 覆寫（依選取順序生成）|
| 點擊「清除」| 重置為空 | 清空 |
| 載入歷史紀錄 | 還原至該筆 selectedIds | 覆寫為該筆 text |
| 手動編輯 textarea | 不動 | 更新 |

**輸出格式**：依 ID 升冪排序（即種類順序）→ 名稱以「、」串接
例：`甘宋梅、紅肉甘宋梅、紅心芭樂乾、鳳梨芯`

---

## 7. 版面佈局（行動優先）

```
┌──────────────────────────┐
│   汪福記商品選取工具      │  ← 固定 header
├──────────────────────────┤
│ ▶ 梅子類                 │  ← 收合
│ ▼ 果、干類               │  ← 展開
│   [洛神花] [芭樂乾✓]   │  ← ✓ = 已選（梅紅底色）
│   ...（可垂直捲動）      │
├──────────────────────────┤
│ 輸出區（完成後自動捲到）  │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │  ← receipt 樣式（等寬字型 + 虛線框）
│   甘宋梅、紅肉甘宋梅      │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│                  [複製]  │
├──────────────────────────┤
│ [展開][完成][歷史紀錄][清除] │  ← 固定底部 action bar
│  env(safe-area-inset-bottom) padding  │
└──────────────────────────┘
```

---

## 8. 互動細節

### ItemChip
- 未選取：白底 + 暖灰邊框
- 已選取：梅紅底（`#8B1A1A`）+ 白字
- Tap 動畫：輕微 scale（`prefers-reduced-motion` 時停用）

### 展開 / 收合按鈕
- 預設文案「展開」，點擊後切換為「收合」
- 只影響展開 UI，不改變任何選取狀態

### 歷史紀錄 Modal
- 列出最多 5 筆，每筆顯示：日期時間 + 文字前 20 字預覽
- 關閉方式：點擊右上角 X Icon 或點擊遮罩區域
- 點選某筆：還原選取區 + 覆寫 textarea + 自動複製 + 顯示回饋 + 關閉 modal

### FeedbackToast
- 每次複製操作都顯示（完成、textarea 複製、歷史載入）
- 內容：「已複製所有商品項目」
- 位置：頂部，2 秒後自動消失

### 歷史紀錄 localStorage
- Key：`wangfuji_history`
- 格式：`HistoryEntry[]`，最多 5 筆，新筆插入頭部，超過時刪除最末筆

---

## 9. 視覺風格（Direction A：傳統訂貨單）

| Token | 值 | 用途 |
|-------|-----|------|
| `bg-paper` | `#F7F3EE` | 頁面背景 |
| `text-espresso` | `#2C1810` | 主要文字 |
| `plum` | `#8B1A1A` | 種類標題、已選取狀態、品牌色 |
| `amber` | `#C8791B` | 「完成」CTA、強調 |
| `border-warm` | `#E9E1D8` | 邊框、分隔線 |
| `success` | `#1B5E2E` | 回饋成功（未使用，toast 用 plum）|

**字型**：
- 種類標題：Noto Serif TC（有份量感）
- 子項目 / 內文：Noto Sans TC（清晰易讀）
- Textarea 輸出區：JetBrains Mono（等寬，熱感應收據質感）

**Signature 元素**：輸出區設計成收據單外觀，虛線邊框 + 等寬字型，讓使用者一眼看出「這是生成的結果」，與選取區視覺上有明確區別。

---

## 10. GitHub Pages 部署

- **Repo**：`TomoyaRT/wangfuji-product-catalog`
- **部署方式**：GitHub Actions（push to `main` → build → deploy to `gh-pages`）
- **Workflow**：使用 `actions/deploy-pages` 或 `peaceiris/actions-gh-pages`
- **Vite `base`**：`'/wangfuji-product-catalog/'`
- **最終 URL**：`https://TomoyaRT.github.io/wangfuji-product-catalog/`
