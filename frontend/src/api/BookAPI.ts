import type { Book } from '../components/BookList'
import { API_BASE_URL } from '../config/api'

// Same idea as Water Project `ProjectAPI.ts` — fetch calls for add/update/delete
const BASE = `${API_BASE_URL}/api/books`

export const addBook = async (book: Book): Promise<Book> => {
  const payload = { ...book, bookID: 0 }
  const response = await fetch(`${BASE}/AddBook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Failed to add book. HTTP status: ${response.status}`)
  }
  return response.json()
}

export const updateBook = async (bookId: number, book: Book): Promise<Book> => {
  const response = await fetch(`${BASE}/UpdateBook/${bookId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  })
  if (!response.ok) {
    throw new Error(`Failed to update book. HTTP status: ${response.status}`)
  }
  return response.json()
}

export const deleteBook = async (bookId: number): Promise<void> => {
  const response = await fetch(`${BASE}/DeleteBook/${bookId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Failed to delete book. HTTP status: ${response.status}`)
  }
}
