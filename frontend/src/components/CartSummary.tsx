import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

// Sticky cart strip: total item count + total price (rubric: quantity AND price on home page)
function CartSummary() {
  const navigate = useNavigate()
  const { cart } = useCart()

  const totalQuantity = cart.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div
      className="card shadow-sm border-primary"
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onClick={() => navigate('/cart')}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate('/cart')
      }}
    >
      <div className="card-body py-3">
        <h5 className="card-title mb-2">Cart</h5>
        <p className="mb-1">
          <strong>Items:</strong> {totalQuantity}
        </p>
        <p className="mb-0">
          <strong>Total:</strong> ${totalPrice.toFixed(2)}
        </p>
        <p className="small text-muted mb-0 mt-2">Click to view cart</p>
      </div>
    </div>
  )
}

export default CartSummary
