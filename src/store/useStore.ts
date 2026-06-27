import { create } from 'zustand'
import { CATEGORIES } from '../data/products'
import type { HistoryEntry } from '../utils/localStorage'
import { initHistory, addHistoryEntry } from '../utils/localStorage'
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
    feedbackTimer = setTimeout(() => set({ feedbackMessage: null }), 1500)
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
