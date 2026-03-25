// One line in the shopping cart (book + how many + price from the database)
export interface CartItem {
  bookID: number
  title: string
  price: number
  quantity: number
}
