import type { Item } from '../data/products'
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
