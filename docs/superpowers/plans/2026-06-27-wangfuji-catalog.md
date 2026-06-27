# 汪福記商品選取工具 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first React + Vite static web app for selecting 汪福記 products and copying the result as comma-separated text, deployed to GitHub Pages.

**Architecture:** Single-page app with Zustand global store, all product data hardcoded in TypeScript, history persisted to localStorage (max 5), fully static — no backend.

**Tech Stack:** React 19, Vite 6, TypeScript, Zustand 5, Tailwind CSS 4 (`@tailwindcss/vite`), Vitest + @testing-library/react, GitHub Actions.

## Global Constraints

- All npm packages: latest stable version at install time
- App title: 汪福記商品選取工具
- Repo: `TomoyaRT/wangfuji-product-catalog`
- Deployed URL: `https://TomoyaRT.github.io/wangfuji-product-catalog/`
- Vite `base`: `/wangfuji-product-catalog/` in production, `/` in dev
- Item ID scheme: `categoryId * 1000 + itemIndex` (1-based per category)
- Output separator: `、`
- Output order: item IDs sorted ascending (preserves category order)
- History key: `wangfuji_history`, max 5 entries, newest first
- Feedback message (every copy): `已複製所有商品項目`, auto-dismiss 2 s
- ActionBar order (left→right): 展開 | 完成 | 歷史紀錄 | 清除
- Target: iPhone Safari
- Palette: paper `#F7F3EE`, espresso `#2C1810`, plum `#8B1A1A`, amber `#C8791B`, muted `#E9E1D8`
- Fonts: Noto Serif TC (category headers), Noto Sans TC (body/items), JetBrains Mono (textarea)

---

## File Map

```
/                               ← repo root (existing git repo)
├── .github/workflows/
│   └── deploy.yml              CREATE — GitHub Actions CI/CD
├── index.html                  CREATE — entry HTML with font links
├── package.json                CREATE — via vite scaffolding
├── vite.config.ts              CREATE — base path + vitest config
├── tsconfig.json               CREATE — via vite scaffolding
├── tsconfig.node.json          CREATE — via vite scaffolding
└── src/
    ├── main.tsx                CREATE — React root mount
    ├── App.tsx                 CREATE — layout + scroll-to logic
    ├── index.css               CREATE — Tailwind v4 import + @theme tokens
    ├── data/
    │   └── products.ts         CREATE — all 9 categories, 143 items
    ├── store/
    │   └── useStore.ts         CREATE — Zustand store (all state + actions)
    ├── utils/
    │   ├── clipboard.ts        CREATE — writeText with execCommand fallback
    │   ├── clipboard.test.ts   CREATE
    │   ├── localStorage.ts     CREATE — history CRUD
    │   └── localStorage.test.ts CREATE
    ├── test/
    │   └── setup.ts            CREATE — jest-dom import
    └── components/
        ├── Header.tsx          CREATE
        ├── FeedbackToast.tsx   CREATE
        ├── CategoryList.tsx    CREATE
        ├── CategoryRow.tsx     CREATE
        ├── ItemChip.tsx        CREATE
        ├── ActionBar.tsx       CREATE
        ├── OutputArea.tsx      CREATE
        └── HistoryModal.tsx    CREATE
```

---

## Task 1: Project Scaffolding + Tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/index.css`, `src/test/setup.ts`

**Interfaces:**
- Produces: runnable `npm run dev`, passing `npm test`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd /Users/tomoya/Desktop/wangfuji-product-catalog
npm create vite@latest . -- --template react-ts
```
When prompted about non-empty directory → choose **"Ignore files and continue"**.

- [ ] **Step 2: Install dependencies**

```bash
npm install zustand
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Write `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'build' ? '/wangfuji-product-catalog/' : '/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
}))
```

- [ ] **Step 4: Write `src/test/setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Write `src/index.css`**

```css
@import "tailwindcss";

@theme {
  --color-paper: #F7F3EE;
  --color-espresso: #2C1810;
  --color-plum: #8B1A1A;
  --color-amber: #C8791B;
  --color-muted: #E9E1D8;
  --font-sans: 'Noto Sans TC', ui-sans-serif, system-ui, sans-serif;
  --font-serif: 'Noto Serif TC', ui-serif, serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}

* {
  -webkit-tap-highlight-color: transparent;
}

body {
  background-color: #F7F3EE;
  color: #2C1810;
  font-family: 'Noto Sans TC', ui-sans-serif, system-ui, sans-serif;
}
```

- [ ] **Step 6: Write `index.html`**

```html
<!doctype html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>汪福記商品選取工具</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500&family=Noto+Serif+TC:wght@400;700&family=JetBrains+Mono&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Write `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 8: Write `src/App.tsx` (placeholder)**

```tsx
export default function App() {
  return <div className="min-h-screen bg-paper p-4">汪福記商品選取工具</div>
}
```

- [ ] **Step 9: Delete Vite default files**

```bash
rm -f src/App.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```
Expected: server starts at `http://localhost:5173/`, page shows「汪福記商品選取工具」on a warm paper background.

- [ ] **Step 11: Commit**

```bash
git add index.html package.json package-lock.json vite.config.ts tsconfig.json tsconfig.node.json src/
git commit -m "feat: scaffold React + Vite + Tailwind v4 + Vitest"
```

---

## Task 2: Product Data

**Files:**
- Create: `src/data/products.ts`

**Interfaces:**
- Produces: `CATEGORIES: Category[]`, `Category`, `Item` types

- [ ] **Step 1: Write `src/data/products.ts`**

```typescript
export interface Item {
  id: number
  name: string
}

export interface Category {
  id: number
  name: string
  items: Item[]
}

export const CATEGORIES: Category[] = [
  {
    id: 1,
    name: '梅子類',
    items: [
      { id: 1001, name: '甘宋梅' },
      { id: 1002, name: '紅肉甘宋梅' },
      { id: 1003, name: '鴛鴦甘宋梅' },
      { id: 1004, name: '奶梅' },
      { id: 1005, name: '福記奶梅/化核奶梅' },
      { id: 1006, name: '霜花梅/小雪梅' },
      { id: 1007, name: '化核梅/紅化核梅' },
      { id: 1008, name: '化核應子' },
      { id: 1009, name: '小紅莓' },
      { id: 1010, name: '紫蘇梅' },
      { id: 1011, name: '脆梅' },
      { id: 1012, name: '凍頂茶梅' },
      { id: 1013, name: '甘草梅' },
      { id: 1014, name: '烏梅' },
      { id: 1015, name: '白/紅話梅' },
      { id: 1016, name: '情人梅' },
      { id: 1017, name: '八珍梅' },
      { id: 1018, name: '酵素梅' },
      { id: 1019, name: '冰梅/梅肉' },
      { id: 1020, name: '甘甜梅/甘橘梅' },
      { id: 1021, name: '咖啡梅' },
      { id: 1022, name: '小福梅' },
      { id: 1023, name: '二代甘宋梅' },
      { id: 1024, name: '福果梅' },
      { id: 1025, name: '福宋梅、沁芳梅 / 茉香梅、抹茶甘宋梅' },
      { id: 1026, name: '桂花梅、鶴頂梅' },
    ],
  },
  {
    id: 2,
    name: '果、干類',
    items: [
      { id: 2001, name: '洛神花/濕洛神花' },
      { id: 2002, name: '芭樂乾/濕芭樂干' },
      { id: 2003, name: '紅心芭樂乾' },
      { id: 2004, name: '梅香、奶香、多多 / 百香、甘草芭樂乾' },
      { id: 2005, name: '(關廟)鳳梨干' },
      { id: 2006, name: '鳳梨芯' },
      { id: 2007, name: '鳳梨花(無糖)' },
      { id: 2008, name: '無糖鳳梨干' },
      { id: 2009, name: '大湖草莓乾' },
      { id: 2010, name: '草莓凍乾' },
      { id: 2011, name: '番茄干系列' },
      { id: 2012, name: '糖酥芒果干' },
      { id: 2013, name: '辣芒果' },
      { id: 2014, name: '脆芒果' },
      { id: 2015, name: '黃金情人果' },
      { id: 2016, name: '土檨芒果干' },
      { id: 2017, name: '梅香情人果' },
      { id: 2018, name: '糖酥情人果' },
      { id: 2019, name: '新品芒果干' },
      { id: 2020, name: '芒果羔' },
      { id: 2021, name: '來亞芒果干' },
      { id: 2022, name: '愛文芒果干' },
      { id: 2023, name: '玉井芒果干' },
      { id: 2024, name: '八仙芒果干' },
      { id: 2025, name: '富士蘋果乾' },
      { id: 2026, name: '鹹葡萄干' },
      { id: 2027, name: '黃金/梅香葡萄干' },
      { id: 2028, name: '黃金水蜜桃' },
      { id: 2029, name: '水蜜桃片' },
      { id: 2030, name: '水蜜桃粒' },
      { id: 2031, name: '相思果' },
      { id: 2032, name: '菊蕊果/戀愛果' },
      { id: 2033, name: '黃金檸檬' },
      { id: 2034, name: '青檸香柚皮' },
      { id: 2035, name: '仙楂檸檬片' },
      { id: 2036, name: '檸檬茶片' },
      { id: 2037, name: '香橙片(泡)' },
      { id: 2038, name: '薄荷金桔' },
      { id: 2039, name: '橘子干' },
      { id: 2040, name: '甘橘皮' },
      { id: 2041, name: '陳皮' },
      { id: 2042, name: '蔓越莓' },
      { id: 2043, name: '黃果' },
      { id: 2044, name: '無花果' },
      { id: 2045, name: '櫻花果' },
      { id: 2046, name: '油切果' },
      { id: 2047, name: '香蜜柳橙片' },
    ],
  },
  {
    id: 3,
    name: '李、棗類',
    items: [
      { id: 3001, name: '大仙李' },
      { id: 3002, name: '化核仙李' },
      { id: 3003, name: '酒李' },
      { id: 3004, name: '脫水李' },
      { id: 3005, name: '甘草杏李' },
      { id: 3006, name: '黑棗' },
    ],
  },
  {
    id: 4,
    name: '橄欖、仙楂類',
    items: [
      { id: 4001, name: '辣椒欖' },
      { id: 4002, name: '薑黃橄欖條' },
      { id: 4003, name: '雪霜橄欖條' },
      { id: 4004, name: '橄欖片' },
      { id: 4005, name: '中藥化核干' },
      { id: 4006, name: '古早味橄欖' },
      { id: 4007, name: '無籽甘草橄欖' },
      { id: 4008, name: '橄欖籤' },
      { id: 4009, name: '仙楂片' },
      { id: 4010, name: '仙楂粒' },
      { id: 4011, name: '仙楂梅' },
    ],
  },
  {
    id: 5,
    name: '魚類',
    items: [
      { id: 5001, name: '白魚' },
      { id: 5002, name: '沙茶魚' },
      { id: 5003, name: '麻辣紅魚' },
      { id: 5004, name: '紅魚片' },
      { id: 5005, name: '小卷片' },
      { id: 5006, name: '麻辣切片' },
      { id: 5007, name: '黑胡椒切片' },
      { id: 5008, name: '海苔切片' },
      { id: 5009, name: '椒麻切片' },
      { id: 5010, name: '燻烤切片' },
      { id: 5011, name: '魷魚條' },
      { id: 5012, name: '魚板條' },
      { id: 5013, name: '魷板條(寬)' },
      { id: 5014, name: '鐵板燒' },
      { id: 5015, name: '魷魚絲' },
      { id: 5016, name: '鱈魚香絲' },
      { id: 5017, name: '紅大豬公' },
      { id: 5018, name: '豬板條' },
      { id: 5019, name: '黑白芝麻' },
      { id: 5020, name: '蒙古烤肉' },
    ],
  },
  {
    id: 6,
    name: '其他',
    items: [
      { id: 6001, name: '焦糖瓜子' },
      { id: 6002, name: '大紅豆' },
      { id: 6003, name: '青豆酥' },
      { id: 6004, name: '薑母糖' },
      { id: 6005, name: '梅粉' },
      { id: 6006, name: '陳皮梅' },
      { id: 6007, name: '菊花桔餅' },
    ],
  },
  {
    id: 7,
    name: '豆干類',
    items: [
      { id: 7001, name: '小豆丁/大豆丁' },
      { id: 7002, name: '黃金辣干條' },
      { id: 7003, name: '麻辣大方塊' },
      { id: 7004, name: '滷味豆干' },
      { id: 7005, name: '素沙茶豆干' },
      { id: 7006, name: '五香蒟蒻條/片' },
    ],
  },
  {
    id: 8,
    name: '糖果類',
    items: [
      { id: 8001, name: '小熊軟糖' },
      { id: 8002, name: '可樂軟糖' },
      { id: 8003, name: '水果粒軟糖' },
      { id: 8004, name: '碗豆軟糖' },
      { id: 8005, name: '綜合圈軟糖' },
      { id: 8006, name: '荷包蛋軟糖' },
      { id: 8007, name: '棉花糖' },
      { id: 8008, name: '足球巧克力' },
      { id: 8009, name: '米果巧克力' },
      { id: 8010, name: '石頭巧克力' },
      { id: 8011, name: '雷根糖' },
      { id: 8012, name: '漢堡糖' },
      { id: 8013, name: '橡皮糖' },
      { id: 8014, name: '日式梅片/餅' },
      { id: 8015, name: '友友球巧克力' },
      { id: 8016, name: '熊貓軟糖' },
    ],
  },
  {
    id: 9,
    name: '未分類',
    items: [
      { id: 9001, name: '無籽仙李' },
      { id: 9002, name: '梅有黃桃' },
      { id: 9003, name: '梅絲' },
      { id: 9004, name: '仙楂條' },
    ],
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/data/products.ts
git commit -m "feat: add product catalog data (9 categories, 143 items)"
```

---

## Task 3: localStorage Utility

**Files:**
- Create: `src/utils/localStorage.ts`, `src/utils/localStorage.test.ts`

**Interfaces:**
- Produces: `HistoryEntry`, `initHistory(): HistoryEntry[]`, `addHistoryEntry(entry, existing): HistoryEntry[]`

- [ ] **Step 1: Write failing tests**

```typescript
// src/utils/localStorage.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { initHistory, addHistoryEntry, HistoryEntry } from './localStorage'

beforeEach(() => localStorage.clear())

describe('initHistory', () => {
  it('returns empty array when nothing stored', () => {
    expect(initHistory()).toEqual([])
  })

  it('returns parsed entries when present', () => {
    const entries: HistoryEntry[] = [
      { id: '1', text: '甘宋梅', selectedIds: [1001], createdAt: '2026/06/27 10:00' },
    ]
    localStorage.setItem('wangfuji_history', JSON.stringify(entries))
    expect(initHistory()).toEqual(entries)
  })
})

describe('addHistoryEntry', () => {
  it('prepends new entry', () => {
    const existing: HistoryEntry[] = [
      { id: '1', text: 'A', selectedIds: [1001], createdAt: '2026/06/27 10:00' },
    ]
    const result = addHistoryEntry({ text: 'B', selectedIds: [1002] }, existing)
    expect(result[0].text).toBe('B')
    expect(result[1].text).toBe('A')
  })

  it('caps at 5 entries, dropping oldest', () => {
    const existing: HistoryEntry[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      text: String(i),
      selectedIds: [],
      createdAt: '',
    }))
    const result = addHistoryEntry({ text: 'new', selectedIds: [] }, existing)
    expect(result).toHaveLength(5)
    expect(result[0].text).toBe('new')
    expect(result[4].text).toBe('3')
  })

  it('persists to localStorage', () => {
    addHistoryEntry({ text: 'X', selectedIds: [1001] }, [])
    const stored = JSON.parse(localStorage.getItem('wangfuji_history')!)
    expect(stored[0].text).toBe('X')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- localStorage
```
Expected: `Cannot find module './localStorage'`

- [ ] **Step 3: Write `src/utils/localStorage.ts`**

```typescript
const HISTORY_KEY = 'wangfuji_history'
const MAX_HISTORY = 5

export interface HistoryEntry {
  id: string
  text: string
  selectedIds: number[]
  createdAt: string
}

export function initHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
  } catch {
    return []
  }
}

export function addHistoryEntry(
  entry: Pick<HistoryEntry, 'text' | 'selectedIds'>,
  existing: HistoryEntry[],
): HistoryEntry[] {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const createdAt = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  const newEntry: HistoryEntry = { ...entry, id: String(Date.now()), createdAt }
  const updated = [newEntry, ...existing].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  return updated
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npm test -- localStorage
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/localStorage.ts src/utils/localStorage.test.ts
git commit -m "feat: localStorage history utility with tests"
```

---

## Task 4: Clipboard Utility

**Files:**
- Create: `src/utils/clipboard.ts`, `src/utils/clipboard.test.ts`

**Interfaces:**
- Produces: `copyToClipboard(text: string): Promise<void>`

- [ ] **Step 1: Write failing tests**

```typescript
// src/utils/clipboard.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { copyToClipboard } from './clipboard'

beforeEach(() => {
  vi.restoreAllMocks()
})

it('uses navigator.clipboard.writeText when available', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.assign(navigator, { clipboard: { writeText } })
  await copyToClipboard('甘宋梅')
  expect(writeText).toHaveBeenCalledWith('甘宋梅')
})

it('falls back to execCommand when clipboard API throws', async () => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockRejectedValue(new Error('blocked')) },
  })
  const execCommand = vi.spyOn(document, 'execCommand').mockReturnValue(true)
  await copyToClipboard('甘宋梅')
  expect(execCommand).toHaveBeenCalledWith('copy')
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- clipboard
```
Expected: `Cannot find module './clipboard'`

- [ ] **Step 3: Write `src/utils/clipboard.ts`**

```typescript
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    el.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
    document.body.appendChild(el)
    el.focus()
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npm test -- clipboard
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/clipboard.ts src/utils/clipboard.test.ts
git commit -m "feat: clipboard utility with execCommand fallback"
```

---

## Task 5: Zustand Store

**Files:**
- Create: `src/store/useStore.ts`, `src/store/useStore.test.ts`

**Interfaces:**
- Consumes: `CATEGORIES` from `../data/products`, `HistoryEntry`, `initHistory`, `addHistoryEntry` from `../utils/localStorage`, `copyToClipboard` from `../utils/clipboard`
- Produces: `useStore` hook, `StoreState` type

- [ ] **Step 1: Write failing tests**

```typescript
// src/store/useStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStore } from './useStore'

vi.mock('../utils/clipboard', () => ({ copyToClipboard: vi.fn().mockResolvedValue(undefined) }))

beforeEach(() => {
  localStorage.clear()
  useStore.setState({
    selectedIds: new Set(),
    expandedCategoryIds: new Set(),
    isAllExpanded: false,
    textareaContent: '',
    history: [],
    isHistoryModalOpen: false,
    feedbackMessage: null,
    shouldScrollToOutput: false,
  })
})

describe('toggleItem', () => {
  it('adds item to selectedIds', () => {
    useStore.getState().toggleItem(1001)
    expect(useStore.getState().selectedIds.has(1001)).toBe(true)
  })

  it('removes item when toggled twice', () => {
    useStore.getState().toggleItem(1001)
    useStore.getState().toggleItem(1001)
    expect(useStore.getState().selectedIds.has(1001)).toBe(false)
  })
})

describe('toggleCategory', () => {
  it('expands a category', () => {
    useStore.getState().toggleCategory(1)
    expect(useStore.getState().expandedCategoryIds.has(1)).toBe(true)
  })

  it('collapses an expanded category', () => {
    useStore.getState().toggleCategory(1)
    useStore.getState().toggleCategory(1)
    expect(useStore.getState().expandedCategoryIds.has(1)).toBe(false)
  })
})

describe('toggleExpandAll', () => {
  it('expands all categories', () => {
    useStore.getState().toggleExpandAll()
    expect(useStore.getState().isAllExpanded).toBe(true)
    expect(useStore.getState().expandedCategoryIds.size).toBe(9)
  })

  it('collapses all when already expanded', () => {
    useStore.getState().toggleExpandAll()
    useStore.getState().toggleExpandAll()
    expect(useStore.getState().isAllExpanded).toBe(false)
    expect(useStore.getState().expandedCategoryIds.size).toBe(0)
  })
})

describe('finalize', () => {
  it('generates text sorted by item ID', async () => {
    useStore.setState({ selectedIds: new Set([2001, 1001]) })
    await useStore.getState().finalize()
    expect(useStore.getState().textareaContent).toBe('甘宋梅、洛神花/濕洛神花')
  })

  it('saves to history and sets shouldScrollToOutput', async () => {
    useStore.setState({ selectedIds: new Set([1001]) })
    await useStore.getState().finalize()
    expect(useStore.getState().history).toHaveLength(1)
    expect(useStore.getState().shouldScrollToOutput).toBe(true)
  })

  it('does nothing when nothing is selected', async () => {
    await useStore.getState().finalize()
    expect(useStore.getState().textareaContent).toBe('')
  })
})

describe('clear', () => {
  it('resets selectedIds, expandedCategoryIds, and textareaContent', () => {
    useStore.setState({
      selectedIds: new Set([1001]),
      expandedCategoryIds: new Set([1]),
      textareaContent: '甘宋梅',
    })
    useStore.getState().clear()
    const s = useStore.getState()
    expect(s.selectedIds.size).toBe(0)
    expect(s.expandedCategoryIds.size).toBe(0)
    expect(s.textareaContent).toBe('')
  })
})

describe('restoreHistory', () => {
  it('restores selectedIds and textareaContent, sets shouldScrollToOutput', async () => {
    const entry = { id: '1', text: '甘宋梅', selectedIds: [1001], createdAt: '2026/06/27 10:00' }
    await useStore.getState().restoreHistory(entry)
    const s = useStore.getState()
    expect(s.selectedIds.has(1001)).toBe(true)
    expect(s.textareaContent).toBe('甘宋梅')
    expect(s.shouldScrollToOutput).toBe(true)
    expect(s.isHistoryModalOpen).toBe(false)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- useStore
```
Expected: `Cannot find module './useStore'`

- [ ] **Step 3: Write `src/store/useStore.ts`**

```typescript
import { create } from 'zustand'
import { CATEGORIES } from '../data/products'
import { HistoryEntry, initHistory, addHistoryEntry } from '../utils/localStorage'
import { copyToClipboard } from '../utils/clipboard'

const ITEM_NAME: Map<number, string> = new Map(
  CATEGORIES.flatMap(c => c.items.map(i => [i.id, i.name])),
)

const ALL_CATEGORY_IDS = new Set(CATEGORIES.map(c => c.id))

function generateText(ids: Set<number>): string {
  return [...ids]
    .sort((a, b) => a - b)
    .map(id => ITEM_NAME.get(id) ?? '')
    .filter(Boolean)
    .join('、')
}

let feedbackTimer: ReturnType<typeof setTimeout> | null = null

export interface StoreState {
  selectedIds: Set<number>
  expandedCategoryIds: Set<number>
  isAllExpanded: boolean
  textareaContent: string
  history: HistoryEntry[]
  isHistoryModalOpen: boolean
  feedbackMessage: string | null
  shouldScrollToOutput: boolean

  toggleItem: (id: number) => void
  toggleCategory: (id: number) => void
  toggleExpandAll: () => void
  finalize: () => Promise<void>
  clear: () => void
  restoreHistory: (entry: HistoryEntry) => Promise<void>
  copyTextarea: () => Promise<void>
  setTextareaContent: (v: string) => void
  openHistoryModal: () => void
  closeHistoryModal: () => void
  dismissFeedback: () => void
  clearScrollFlag: () => void
}

export const useStore = create<StoreState>((set, get) => {
  const showFeedback = () => {
    if (feedbackTimer) clearTimeout(feedbackTimer)
    set({ feedbackMessage: '已複製所有商品項目' })
    feedbackTimer = setTimeout(() => set({ feedbackMessage: null }), 2000)
  }

  return {
    selectedIds: new Set(),
    expandedCategoryIds: new Set(),
    isAllExpanded: false,
    textareaContent: '',
    history: initHistory(),
    isHistoryModalOpen: false,
    feedbackMessage: null,
    shouldScrollToOutput: false,

    toggleItem: (id) =>
      set((s) => {
        const next = new Set(s.selectedIds)
        next.has(id) ? next.delete(id) : next.add(id)
        return { selectedIds: next }
      }),

    toggleCategory: (id) =>
      set((s) => {
        const next = new Set(s.expandedCategoryIds)
        next.has(id) ? next.delete(id) : next.add(id)
        return { expandedCategoryIds: next, isAllExpanded: false }
      }),

    toggleExpandAll: () =>
      set((s) =>
        s.isAllExpanded
          ? { expandedCategoryIds: new Set(), isAllExpanded: false }
          : { expandedCategoryIds: new Set(ALL_CATEGORY_IDS), isAllExpanded: true },
      ),

    finalize: async () => {
      const { selectedIds, history } = get()
      const text = generateText(selectedIds)
      if (!text) return
      const newHistory = addHistoryEntry({ text, selectedIds: [...selectedIds] }, history)
      await copyToClipboard(text)
      set({ textareaContent: text, history: newHistory, shouldScrollToOutput: true })
      showFeedback()
    },

    clear: () =>
      set({
        selectedIds: new Set(),
        expandedCategoryIds: new Set(),
        isAllExpanded: false,
        textareaContent: '',
      }),

    restoreHistory: async (entry) => {
      await copyToClipboard(entry.text)
      set({
        selectedIds: new Set(entry.selectedIds),
        textareaContent: entry.text,
        isHistoryModalOpen: false,
        shouldScrollToOutput: true,
      })
      showFeedback()
    },

    copyTextarea: async () => {
      const { textareaContent } = get()
      if (!textareaContent) return
      await copyToClipboard(textareaContent)
      showFeedback()
    },

    setTextareaContent: (v) => set({ textareaContent: v }),
    openHistoryModal: () => set({ isHistoryModalOpen: true }),
    closeHistoryModal: () => set({ isHistoryModalOpen: false }),
    dismissFeedback: () => set({ feedbackMessage: null }),
    clearScrollFlag: () => set({ shouldScrollToOutput: false }),
  }
})
```

- [ ] **Step 4: Run — expect PASS**

```bash
npm test -- useStore
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/store/useStore.ts src/store/useStore.test.ts
git commit -m "feat: Zustand store with all actions and tests"
```

---

## Task 6: ItemChip Component

**Files:**
- Create: `src/components/ItemChip.tsx`

**Interfaces:**
- Consumes: `Item` from `../data/products`, `useStore`
- Produces: `<ItemChip item={Item} />`

- [ ] **Step 1: Write `src/components/ItemChip.tsx`**

```tsx
import { Item } from '../data/products'
import { useStore } from '../store/useStore'

interface Props {
  item: Item
}

export default function ItemChip({ item }: Props) {
  const selected = useStore((s) => s.selectedIds.has(item.id))
  const toggleItem = useStore((s) => s.toggleItem)

  return (
    <button
      onClick={() => toggleItem(item.id)}
      aria-pressed={selected}
      className={[
        'px-3 py-1.5 rounded-full text-sm font-sans border transition-colors duration-150',
        'active:scale-95',
        selected
          ? 'bg-plum text-paper border-plum'
          : 'bg-paper text-espresso border-muted',
      ].join(' ')}
    >
      {item.name}
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ItemChip.tsx
git commit -m "feat: ItemChip selectable chip component"
```

---

## Task 7: CategoryRow + CategoryList Components

**Files:**
- Create: `src/components/CategoryRow.tsx`, `src/components/CategoryList.tsx`

**Interfaces:**
- Consumes: `Category` from `../data/products`, `useStore`, `ItemChip`
- Produces: `<CategoryList />`, `<CategoryRow category={Category} />`

- [ ] **Step 1: Write `src/components/CategoryRow.tsx`**

```tsx
import { Category } from '../data/products'
import { useStore } from '../store/useStore'
import ItemChip from './ItemChip'

interface Props {
  category: Category
}

export default function CategoryRow({ category }: Props) {
  const expanded = useStore((s) => s.expandedCategoryIds.has(category.id))
  const toggleCategory = useStore((s) => s.toggleCategory)

  return (
    <div className="border-b border-muted">
      <button
        onClick={() => toggleCategory(category.id)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <span className="font-serif font-bold text-plum text-base">
          {category.name}
        </span>
        <span className="text-muted text-lg leading-none">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {category.items.map((item) => (
            <ItemChip key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write `src/components/CategoryList.tsx`**

```tsx
import { CATEGORIES } from '../data/products'
import CategoryRow from './CategoryRow'

export default function CategoryList() {
  return (
    <div className="flex-1 overflow-y-auto">
      {CATEGORIES.map((cat) => (
        <CategoryRow key={cat.id} category={cat} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CategoryRow.tsx src/components/CategoryList.tsx
git commit -m "feat: CategoryRow accordion and CategoryList"
```

---

## Task 8: ActionBar Component

**Files:**
- Create: `src/components/ActionBar.tsx`

**Interfaces:**
- Consumes: `useStore`, `onFinalize: () => void` prop (App handles scroll)
- Produces: `<ActionBar onFinalize={() => void} />`

- [ ] **Step 1: Write `src/components/ActionBar.tsx`**

```tsx
import { useStore } from '../store/useStore'

interface Props {
  onFinalize: () => void
}

export default function ActionBar({ onFinalize }: Props) {
  const isAllExpanded = useStore((s) => s.isAllExpanded)
  const toggleExpandAll = useStore((s) => s.toggleExpandAll)
  const openHistoryModal = useStore((s) => s.openHistoryModal)
  const clear = useStore((s) => s.clear)

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-paper border-t border-muted flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <button
        onClick={toggleExpandAll}
        className="flex-1 py-3 text-sm text-espresso font-medium border-r border-muted"
      >
        {isAllExpanded ? '收合' : '展開'}
      </button>
      <button
        onClick={onFinalize}
        className="flex-1 py-3 text-sm font-bold text-paper bg-amber border-r border-muted"
      >
        完成
      </button>
      <button
        onClick={openHistoryModal}
        className="flex-1 py-3 text-sm text-espresso font-medium border-r border-muted"
      >
        歷史紀錄
      </button>
      <button
        onClick={clear}
        className="flex-1 py-3 text-sm text-espresso font-medium"
      >
        清除
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ActionBar.tsx
git commit -m "feat: ActionBar with 展開/完成/歷史紀錄/清除"
```

---

## Task 9: OutputArea Component

**Files:**
- Create: `src/components/OutputArea.tsx`

**Interfaces:**
- Consumes: `useStore`
- Produces: `<OutputArea ref={ForwardedRef<HTMLDivElement>} />`

- [ ] **Step 1: Write `src/components/OutputArea.tsx`**

```tsx
import { forwardRef } from 'react'
import { useStore } from '../store/useStore'

const OutputArea = forwardRef<HTMLDivElement>((_, ref) => {
  const textareaContent = useStore((s) => s.textareaContent)
  const setTextareaContent = useStore((s) => s.setTextareaContent)
  const copyTextarea = useStore((s) => s.copyTextarea)

  return (
    <div ref={ref} className="px-4 pt-4 pb-6">
      <p className="text-xs text-espresso/50 mb-2 font-sans">輸出結果</p>
      <div className="border-2 border-dashed border-muted rounded-lg p-3">
        <textarea
          value={textareaContent}
          onChange={(e) => setTextareaContent(e.target.value)}
          placeholder="點擊「完成」後，結果會顯示在這裡"
          rows={4}
          className="w-full bg-transparent font-mono text-sm text-espresso resize-none focus:outline-none placeholder:text-espresso/30"
        />
      </div>
      <button
        onClick={copyTextarea}
        disabled={!textareaContent}
        className="mt-3 w-full py-2 rounded-lg border border-plum text-plum text-sm font-medium disabled:opacity-30"
      >
        複製
      </button>
    </div>
  )
})

OutputArea.displayName = 'OutputArea'
export default OutputArea
```

- [ ] **Step 2: Commit**

```bash
git add src/components/OutputArea.tsx
git commit -m "feat: OutputArea receipt-style textarea with copy button"
```

---

## Task 10: FeedbackToast Component

**Files:**
- Create: `src/components/FeedbackToast.tsx`

**Interfaces:**
- Consumes: `useStore`
- Produces: `<FeedbackToast />`

- [ ] **Step 1: Write `src/components/FeedbackToast.tsx`**

```tsx
import { useStore } from '../store/useStore'

export default function FeedbackToast() {
  const feedbackMessage = useStore((s) => s.feedbackMessage)

  if (!feedbackMessage) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-plum text-paper text-sm px-4 py-2 rounded-full shadow-lg"
    >
      {feedbackMessage}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FeedbackToast.tsx
git commit -m "feat: FeedbackToast auto-dismiss notification"
```

---

## Task 11: HistoryModal Component

**Files:**
- Create: `src/components/HistoryModal.tsx`

**Interfaces:**
- Consumes: `useStore`
- Produces: `<HistoryModal />`

- [ ] **Step 1: Write `src/components/HistoryModal.tsx`**

```tsx
import { useStore } from '../store/useStore'

export default function HistoryModal() {
  const isOpen = useStore((s) => s.isHistoryModalOpen)
  const history = useStore((s) => s.history)
  const closeHistoryModal = useStore((s) => s.closeHistoryModal)
  const restoreHistory = useStore((s) => s.restoreHistory)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-end"
      onClick={closeHistoryModal}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-espresso/40" />

      {/* Sheet */}
      <div
        className="relative z-50 w-full bg-paper rounded-t-2xl max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-muted">
          <span className="font-serif font-bold text-plum">歷史紀錄</span>
          <button
            onClick={closeHistoryModal}
            aria-label="關閉"
            className="text-espresso/50 text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        {/* Entries */}
        {history.length === 0 ? (
          <p className="px-4 py-6 text-sm text-espresso/40 text-center">尚無紀錄</p>
        ) : (
          <ul>
            {history.map((entry) => (
              <li key={entry.id}>
                <button
                  onClick={() => restoreHistory(entry)}
                  className="w-full text-left px-4 py-3 border-b border-muted"
                >
                  <p className="text-xs text-espresso/50 mb-0.5">{entry.createdAt}</p>
                  <p className="text-sm text-espresso font-mono truncate">{entry.text}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HistoryModal.tsx
git commit -m "feat: HistoryModal bottom sheet with entry restore"
```

---

## Task 12: Header + App Assembly

**Files:**
- Create: `src/components/Header.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: all components, `useStore`

- [ ] **Step 1: Write `src/components/Header.tsx`**

```tsx
export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-paper border-b border-muted px-4 py-3">
      <h1 className="font-serif font-bold text-plum text-base">汪福記商品選取工具</h1>
    </header>
  )
}
```

- [ ] **Step 2: Write `src/App.tsx`**

```tsx
import { useRef, useEffect } from 'react'
import { useStore } from './store/useStore'
import Header from './components/Header'
import CategoryList from './components/CategoryList'
import ActionBar from './components/ActionBar'
import OutputArea from './components/OutputArea'
import FeedbackToast from './components/FeedbackToast'
import HistoryModal from './components/HistoryModal'

export default function App() {
  const outputAreaRef = useRef<HTMLDivElement>(null)
  const finalize = useStore((s) => s.finalize)
  const shouldScrollToOutput = useStore((s) => s.shouldScrollToOutput)
  const clearScrollFlag = useStore((s) => s.clearScrollFlag)

  useEffect(() => {
    if (shouldScrollToOutput) {
      setTimeout(() => {
        outputAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
      clearScrollFlag()
    }
  }, [shouldScrollToOutput, clearScrollFlag])

  const handleFinalize = () => {
    finalize()
  }

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <FeedbackToast />
      <Header />
      <main className="flex-1 pb-16">
        <CategoryList />
        <OutputArea ref={outputAreaRef} />
      </main>
      <ActionBar onFinalize={handleFinalize} />
      <HistoryModal />
    </div>
  )
}
```

- [ ] **Step 3: Run dev server and smoke-test manually**

```bash
npm run dev
```
Check on browser (resize to mobile width):
- All 9 categories render
- Tapping a category expands/collapses
- Tapping items toggles plum selection
- 展開 expands all, changes to 收合
- 完成 generates text in textarea and scrolls to it
- Toast appears for 2s then disappears
- 清除 resets everything
- 歷史紀錄 opens modal, past entries load on tap
- Modal closes on X or backdrop tap

- [ ] **Step 4: Run full test suite**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx src/App.tsx
git commit -m "feat: App assembly — wire all components with scroll-to-output"
```

---

## Task 13: GitHub Actions Deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci

      - run: npm run build

      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

- [ ] **Step 2: Enable GitHub Pages in repo settings**

Go to `https://github.com/TomoyaRT/wangfuji-product-catalog/settings/pages`
→ Source: **Deploy from a branch** → Branch: **gh-pages** → folder: **/ (root)** → Save.

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: GitHub Actions deploy to gh-pages"
git push origin main
```

- [ ] **Step 4: Verify deployment**

Wait ~2 minutes, then open `https://TomoyaRT.github.io/wangfuji-product-catalog/` in iPhone Safari.
Expected: app loads, all categories render, copy and history work correctly.
