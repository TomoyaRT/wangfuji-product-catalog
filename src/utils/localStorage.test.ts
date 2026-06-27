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
