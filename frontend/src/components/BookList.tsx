import { useEffect, useState } from 'react'
import axios from 'axios'

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

const API_BASE_URL = 'http://127.0.0.1:4000' // avoid IPv6 localhost resolution issues

export function BookList() {
  const [books, setBooks] = useState<Book[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalCount, setTotalCount] = useState(0)
  const [sortBy, setSortBy] = useState<'title' | null>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  useEffect(() => {
    async function loadBooks() {
      try {
        setIsLoading(true)
        setError(null)

        const params: Record<string, string | number> = {
          pageNumber,
          pageSize,
        }

        if (sortBy) {
          params.sortBy = sortBy
          params.sortDirection = sortDirection
        }

        const response = await axios.get<PagedResult<Book>>(
          `${API_BASE_URL}/api/books`,
          { params },
        )

        setBooks(response.data.items)
        setTotalCount(response.data.totalCount)
      } catch (err) {
        setError('Failed to load books. Please make sure the API is running.')
      } finally {
        setIsLoading(false)
      }
    }

    loadBooks()
  }, [pageNumber, pageSize, sortBy, sortDirection])

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

  return (
    <div className="container my-4">
      <h1 className="mb-4 text-dark">Online Bookstore</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
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

      <div className="table-responsive">
        <table className="table table-striped table-hover">
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
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center">
                  Loading...
                </td>
              </tr>
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <button
          className="btn btn-primary"
          onClick={handlePreviousPage}
          disabled={pageNumber === 1}
        >
          Previous
        </button>

        <button
          className="btn btn-primary"
          onClick={handleNextPage}
          disabled={pageNumber === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}

