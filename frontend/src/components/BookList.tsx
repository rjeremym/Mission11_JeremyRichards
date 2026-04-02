import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import { saveBookListSession } from '../utils/bookListSession'
import type { BookListSessionState } from '../utils/bookListSession'
import { deleteBook } from '../api/BookAPI'
import NewBookForm from './NewBookForm'
import EditBookForm from './EditBookForm'

export interface Book {
  bookID: number
  title: string
  author: string
  publisher: string
  isbn: string
  classification: string
  category: string
  pageCount: number
  price: number
}

interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

type Props = {
  selectedCategories: string[]
  initialListState: BookListSessionState | null
}

// Main book list + cart + DB CRUD on the same page (default user = admin, like Water Project intent)
export function BookList({ selectedCategories, initialListState }: Props) {
  const navigate = useNavigate()
  const [books, setBooks] = useState<Book[]>([])
  const [pageNumber, setPageNumber] = useState(
    initialListState?.pageNumber ?? 1,
  )
  const [pageSize, setPageSize] = useState(initialListState?.pageSize ?? 5)
  const [totalCount, setTotalCount] = useState(0)
  const [sortBy, setSortBy] = useState<'title' | null>(
    initialListState?.sortBy ?? 'title',
  )
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    initialListState?.sortDirection ?? 'asc',
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const colCount = 11

  // When filters change, go back to page 1 so paging matches filtered count
  useEffect(() => {
    setPageNumber(1)
  }, [selectedCategories.join('|')])

  // Persist list state for "Continue shopping" / session restore
  useEffect(() => {
    saveBookListSession({
      pageNumber,
      pageSize,
      selectedCategories,
      sortBy,
      sortDirection,
    })
  }, [pageNumber, pageSize, selectedCategories, sortBy, sortDirection])

  useEffect(() => {
    async function loadBooks() {
      try {
        setIsLoading(true)
        setError(null)

        const params: Record<string, string | number | string[]> = {
          pageNumber,
          pageSize,
        }

        if (sortBy) {
          params.sortBy = sortBy
          params.sortDirection = sortDirection
        }

        if (selectedCategories.length > 0) {
          params.categories = selectedCategories
        }

        const response = await axios.get<PagedResult<Book>>(
          `${API_BASE_URL}/api/books`,
          {
            params,
            paramsSerializer: (p) => {
              const sp = new URLSearchParams()
              Object.entries(p).forEach(([key, value]) => {
                if (value === undefined || value === null) return
                if (Array.isArray(value)) {
                  value.forEach((v) => sp.append(key, String(v)))
                } else {
                  sp.append(key, String(value))
                }
              })
              return sp.toString()
            },
          },
        )

        setBooks(response.data.items)
        setTotalCount(response.data.totalCount)
      } catch (err) {
        setError('Failed to load books. Is the API running on HTTPS :5000?')
      } finally {
        setIsLoading(false)
      }
    }

    loadBooks()
  }, [
    pageNumber,
    pageSize,
    sortBy,
    sortDirection,
    selectedCategories,
    reloadKey,
  ])

  function bumpReload() {
    setReloadKey((k) => k + 1)
  }

  function handlePreviousPage() {
    setPageNumber((prev) => Math.max(1, prev - 1))
  }

  function handleNextPage() {
    setPageNumber((prev) => Math.min(totalPages, prev + 1))
  }

  function handlePageSizeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const newSize = Number(event.target.value)
    setPageSize(newSize)
    setPageNumber(1)
  }

  function handleTitleClick() {
    setSortBy('title')
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    setPageNumber(1)
  }

  function goAddToCart(book: Book) {
    saveBookListSession({
      pageNumber,
      pageSize,
      selectedCategories,
      sortBy,
      sortDirection,
    })
    navigate(`/add-to-cart/${book.bookID}`)
  }

  async function handleDeleteBook(bookId: number) {
    const ok = window.confirm('Are you sure you want to delete this book?')
    if (!ok) return
    try {
      await deleteBook(bookId)
      bumpReload()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-dark h2">Browse books</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!showAddForm && (
        <button
          type="button"
          className="btn btn-success mb-3"
          onClick={() => setShowAddForm(true)}
        >
          Add new book
        </button>
      )}

      {showAddForm && (
        <NewBookForm
          onSuccess={() => {
            setShowAddForm(false)
            bumpReload()
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingBook && (
        <EditBookForm
          book={editingBook}
          onSuccess={() => {
            setEditingBook(null)
            bumpReload()
          }}
          onCancel={() => setEditingBook(null)}
        />
      )}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <label htmlFor="pageSizeSelect" className="me-2">
            Results per page:
          </label>
          <select
            id="pageSizeSelect"
            className="form-select d-inline-block w-auto"
            value={pageSize}
            onChange={handlePageSizeChange}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>

        <div>
          Page {pageNumber} of {totalPages} ({totalCount} books)
        </div>
      </div>

      <div className="table-responsive w-100">
        <table className="table table-sm table-striped table-hover align-middle mb-0">
          <thead>
            <tr>
              <th
                scope="col"
                style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                onClick={handleTitleClick}
              >
                Title{' '}
                {sortBy === 'title' && (
                  <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th scope="col">Author</th>
              <th scope="col">Publisher</th>
              <th scope="col">ISBN</th>
              <th scope="col">Classification</th>
              <th scope="col">Category</th>
              <th scope="col">Pages</th>
              <th scope="col">Price</th>
              <th scope="col">Cart</th>
              <th scope="col">Edit</th>
              <th scope="col">Delete</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={colCount} className="text-center">
                  Loading...
                </td>
              </tr>
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="text-center">
                  No books found.
                </td>
              </tr>
            ) : (
              books.map((book) => (
                <tr key={book.bookID}>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.publisher}</td>
                  <td>{book.isbn}</td>
                  <td>{book.classification}</td>
                  <td>{book.category}</td>
                  <td>{book.pageCount}</td>
                  <td>${book.price.toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={() => goAddToCart(book)}
                    >
                      Add
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setEditingBook(book)}
                    >
                      Edit
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteBook(book.bookID)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <button
          className="btn btn-primary"
          type="button"
          onClick={handlePreviousPage}
          disabled={pageNumber === 1}
        >
          Previous
        </button>

        <button
          className="btn btn-primary"
          type="button"
          onClick={handleNextPage}
          disabled={pageNumber === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}
