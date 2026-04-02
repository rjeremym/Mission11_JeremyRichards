using Bookstore.API.Data;
using Bookstore.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bookstore.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly BookstoreContext _context;

    public BooksController(BookstoreContext context)
    {
        _context = context;
    }

    // Pull category names from the database for the filter UI (not inserting—just reading)
    // GET: all distinct categories from the Books table (for filter checkboxes)
    [HttpGet("categories")]
    public async Task<ActionResult<List<string>>> GetCategories()
    {
        var categories = await _context.Books
            .Select(b => b.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();

        return Ok(categories);
    }

    // GET: one book by id (used on the add-to-cart page)
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Book>> GetBook(int id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null)
        {
            return NotFound();
        }

        return Ok(book);
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<Book>>> GetBooks(
        int pageNumber = 1,
        int pageSize = 5,
        string? sortBy = null,
        string sortDirection = "asc",
        [FromQuery] List<string>? categories = null)
    {
        if (pageNumber < 1)
        {
            pageNumber = 1;
        }

        if (pageSize < 1)
        {
            pageSize = 5;
        }

        // Filter in memory of EF query before Skip/Take so page count matches category
        IQueryable<Book> query = _context.Books;

        if (categories is { Count: > 0 })
        {
            query = query.Where(b => categories.Contains(b.Category));
        }

        if (!string.IsNullOrWhiteSpace(sortBy) &&
            sortBy.Equals("title", StringComparison.OrdinalIgnoreCase))
        {
            bool descending = sortDirection.Equals("desc", StringComparison.OrdinalIgnoreCase);
            query = descending
                ? query.OrderByDescending(b => b.Title)
                : query.OrderBy(b => b.Title);
        }
        else
        {
            query = query.OrderBy(b => b.BookID);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new PagedResult<Book>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return Ok(result);
    }

    // POST: insert a new row into Books (Mission 13 admin)
    [HttpPost("AddBook")]
    public async Task<ActionResult<Book>> AddBook([FromBody] Book book)
    {
        book.BookID = 0;
        _context.Books.Add(book);
        await _context.SaveChangesAsync();
        return Ok(book);
    }

    // PUT: change an existing book in the database
    [HttpPut("UpdateBook/{id:int}")]
    public async Task<ActionResult<Book>> UpdateBook(int id, [FromBody] Book updated)
    {
        var existing = await _context.Books.FindAsync(id);
        if (existing == null)
        {
            return NotFound();
        }

        existing.Title = updated.Title;
        existing.Author = updated.Author;
        existing.Publisher = updated.Publisher;
        existing.ISBN = updated.ISBN;
        existing.Classification = updated.Classification;
        existing.Category = updated.Category;
        existing.PageCount = updated.PageCount;
        existing.Price = updated.Price;

        await _context.SaveChangesAsync();
        return Ok(existing);
    }

    // DELETE: remove a book row from the database
    [HttpDelete("DeleteBook/{id:int}")]
    public async Task<IActionResult> DeleteBook(int id)
    {
        var existing = await _context.Books.FindAsync(id);
        if (existing == null)
        {
            return NotFound();
        }

        _context.Books.Remove(existing);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}
