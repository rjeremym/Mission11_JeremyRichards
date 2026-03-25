import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { API_BASE_URL } from '../config/api'
import type { Book } from '../components/BookList'

// Separate page to pick quantity and add book lines into the cart (Water-style flow)
function AddToCartPage() {
  const navigate = useNavigate()
  const { bookId } = useParams()
  const { addToCart } = useCart()
  const [book, setBook] = useState<Book | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBook() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/books/${bookId}`)
        if (!res.ok) throw new Error('Not found')
        const data: Book = await res.json()
        setBook(data)
      } catch {
        setError('Could not load that book.')
      }
    }

    if (bookId) loadBook()
  }, [bookId])

  function handleAdd() {
    if (!book) return
    // Put the book + quantity into cart context (still not touching SQLite)
    addToCart({
      bookID: book.bookID,
      title: book.title,
      price: book.price,
      quantity,
    })
    navigate('/cart')
  }

  if (error) {
    return (
      <div className="container py-4 text-black">
        <div className="alert alert-danger">{error}</div>
        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="container py-4 text-black">
        <p className="mb-0">Loading…</p>
      </div>
    )
  }

  return (
    <div className="container py-4 text-black">
      <h2 className="mb-3 text-black">Add to cart</h2>
      <p className="lead mb-1 text-black">{book.title}</p>
      <p className="text-black mb-2">${book.price.toFixed(2)} each</p>

      <div className="mb-3" style={{ maxWidth: '200px' }}>
        <label htmlFor="qty" className="form-label text-black">
          Quantity
        </label>
        <input
          id="qty"
          type="number"
          min={1}
          className="form-control"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
        />
      </div>

      <div className="d-flex gap-2">
        <button type="button" className="btn btn-primary" onClick={handleAdd}>
          Add to cart
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    </div>
  )
}

export default AddToCartPage
