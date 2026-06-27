import type { Category } from '../data/products'
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
