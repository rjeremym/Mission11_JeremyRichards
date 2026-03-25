import { createContext, useContext, useState, type ReactNode } from 'react'
import type { CartItem } from '../types/CartItem'

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity: number }) => void
  removeFromCart: (bookID: number) => void
  setLineQuantity: (bookID: number, quantity: number) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([])

  // Add qty to cart in React state only (not writing to the database)
  // Add X copies of a book; if already in cart, increase quantity (like Water Project merge)
  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity: number }) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.bookID === item.bookID)
      if (existing) {
        return prev.map((c) =>
          c.bookID === item.bookID
            ? { ...c, quantity: c.quantity + item.quantity }
            : c,
        )
      }

      return [
        ...prev,
        {
          bookID: item.bookID,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        },
      ]
    })
  }

  const removeFromCart = (bookID: number) => {
    setCart((prev) => prev.filter((c) => c.bookID !== bookID))
  }

  const setLineQuantity = (bookID: number, quantity: number) => {
    const q = Math.max(0, Math.floor(quantity))
    if (q === 0) {
      removeFromCart(bookID)
      return
    }

    setCart((prev) =>
      prev.map((c) => (c.bookID === bookID ? { ...c, quantity: q } : c)),
    )
  }

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, setLineQuantity }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used inside CartProvider')
  }
  return ctx
}
