import { useState } from 'react'
import type { Book } from './BookList'
import { updateBook } from '../api/BookAPI'

interface EditBookFormProps {
  book: Book
  onSuccess: () => void
  onCancel: () => void
}

// Form to update an existing book in the database (PUT)
function EditBookForm({ book, onSuccess, onCancel }: EditBookFormProps) {
  const [formData, setFormData] = useState<Book>({ ...book })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: name === 'price' ? parseFloat(value) || 0 : parseInt(value, 10) || 0,
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateBook(formData.bookID, formData)
    onSuccess()
  }

  return (
    <form className="card card-body mb-4 border border-primary" onSubmit={handleSubmit}>
      <h2 className="h4 mb-3">Edit book (ID {formData.bookID})</h2>
      <div className="row g-2">
        <div className="col-md-6">
          <label className="form-label">
            Title
            <input
              className="form-control"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div className="col-md-6">
          <label className="form-label">
            Author
            <input
              className="form-control"
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div className="col-md-6">
          <label className="form-label">
            Publisher
            <input
              className="form-control"
              type="text"
              name="publisher"
              value={formData.publisher}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div className="col-md-6">
          <label className="form-label">
            ISBN
            <input
              className="form-control"
              type="text"
              name="isbn"
              value={formData.isbn}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div className="col-md-6">
          <label className="form-label">
            Classification
            <input
              className="form-control"
              type="text"
              name="classification"
              value={formData.classification}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div className="col-md-6">
          <label className="form-label">
            Category
            <input
              className="form-control"
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div className="col-md-6">
          <label className="form-label">
            Page count
            <input
              className="form-control"
              type="number"
              name="pageCount"
              min={1}
              value={formData.pageCount || ''}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div className="col-md-6">
          <label className="form-label">
            Price
            <input
              className="form-control"
              type="number"
              name="price"
              min={0}
              step="0.01"
              value={formData.price || ''}
              onChange={handleChange}
              required
            />
          </label>
        </div>
      </div>
      <div className="mt-3 d-flex gap-2">
        <button type="submit" className="btn btn-primary">
          Update book
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default EditBookForm
