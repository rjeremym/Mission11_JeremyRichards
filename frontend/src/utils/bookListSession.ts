// Remember list page (page, filters, sort) so "Continue shopping" can restore it
const STORAGE_KEY = 'bookstoreBookListState'

export interface BookListSessionState {
  pageNumber: number
  pageSize: number
  selectedCategories: string[]
  sortBy: 'title' | null
  sortDirection: 'asc' | 'desc'
}

export function loadBookListSession(): BookListSessionState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as BookListSessionState
  } catch {
    return null
  }
}

export function saveBookListSession(state: BookListSessionState) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
