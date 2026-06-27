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
