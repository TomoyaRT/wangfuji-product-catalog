import { useStore } from '../store/useStore'

export default function ActionBar() {
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
