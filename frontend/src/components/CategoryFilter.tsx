import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config/api'

type Props = {
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
}

// Multi-select categories like Water Project (checkboxes + API list)
function CategoryFilter({ selectedCategories, setSelectedCategories }: Props) {
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/books/categories`)
        const data: string[] = await res.json()
        setCategories(data)
      } catch (e) {
        console.error('Error loading categories', e)
      }
    }

    loadCategories()
  }, [])

  function handleCheckboxChange({ target }: React.ChangeEvent<HTMLInputElement>) {
    const value = target.value
    const next = selectedCategories.includes(value)
      ? selectedCategories.filter((c) => c !== value)
      : [...selectedCategories, value]
    setSelectedCategories(next)
  }

  return (
    <div className="category-filter">
      <p className="small text-muted mb-2">Check one or more categories.</p>
      <div className="d-flex flex-column gap-2">
        {categories.map((c) => (
          <div key={c} className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id={`cat-${c}`}
              value={c}
              checked={selectedCategories.includes(c)}
              onChange={handleCheckboxChange}
            />
            <label className="form-check-label" htmlFor={`cat-${c}`}>
              {c}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CategoryFilter
