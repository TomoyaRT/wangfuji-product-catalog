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
