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
