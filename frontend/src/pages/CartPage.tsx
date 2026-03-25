import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

// Full cart: each row shows qty, unit price, line subtotal, and order total
function CartPage() {
  const navigate = useNavigate()
  const { cart, removeFromCart, setLineQuantity } = useCart()

  const orderTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div className="container py-4 text-black">
      <h2 className="mb-3 text-black">Your cart</h2>

      {cart.length === 0 ? (
        <p className="text-black mb-0">Your cart is empty.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle text-black">
            <thead>
              <tr>
                <th>Book</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Subtotal</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.bookID}>
                  <td>{item.title}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      className="form-control form-control-sm"
                      style={{ width: '5rem' }}
                      value={item.quantity}
                      onChange={(e) =>
                        setLineQuantity(item.bookID, Number(e.target.value) || 1)
                      }
                    />
                  </td>
                  <td>${(item.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeFromCart(item.bookID)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="fs-5 mt-3 text-black">
        <strong>Total:</strong> ${orderTotal.toFixed(2)}
      </p>

      <div className="d-flex gap-2 mt-3">
        {/* Return to the book list; BooksPage reads saved session so paging/filters restore */}
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
          Continue shopping
        </button>
      </div>
    </div>
  )
}

export default CartPage
