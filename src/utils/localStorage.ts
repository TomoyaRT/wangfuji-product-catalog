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
