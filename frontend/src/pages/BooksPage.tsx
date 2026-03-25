import { useMemo, useState } from 'react'
import CategoryFilter from '../components/CategoryFilter'
import CartSummary from '../components/CartSummary'
import { BookList } from '../components/BookList'
import { loadBookListSession } from '../utils/bookListSession'

// Main bookstore: Bootstrap grid + accordion (collapsible filters) + sticky cart column
function BooksPage() {
  const saved = useMemo(() => loadBookListSession(), [])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    saved?.selectedCategories ?? [],
  )

  return (
    <div className="container-fluid px-3 px-lg-4 py-3">
      <h2 className="text-dark mb-3">Online Bookstore</h2>

      {/* Default row align-items is stretch so the cart column is as tall as the book list; */}
      {/* otherwise the cart column is only ~card height and position:sticky has no room to work. */}
      <div className="row g-4">
        <div className="col-lg-2 col-xl-2 align-self-start">
          <div className="accordion" id="bookstoreFiltersAccordion">
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button
                  className="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseCategoryFilters"
                  aria-expanded="true"
                  aria-controls="collapseCategoryFilters"
                >
                  Filter by category
                </button>
              </h2>
              <div
                id="collapseCategoryFilters"
                className="accordion-collapse collapse show"
                data-bs-parent="#bookstoreFiltersAccordion"
              >
                <div className="accordion-body">
                  <CategoryFilter
                    selectedCategories={selectedCategories}
                    setSelectedCategories={setSelectedCategories}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-7 col-xl-8 min-width-0">
          <BookList
            selectedCategories={selectedCategories}
            initialListState={saved}
          />
        </div>

        <div className="col-lg-3 col-xl-2">
          <div
            className="sticky-top pt-1"
            style={{ top: '1rem', zIndex: 1030 }}
          >
            <CartSummary />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BooksPage
