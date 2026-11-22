package br.edu.unifal.readingtracker.service;

import br.edu.unifal.readingtracker.domain.Author;
import br.edu.unifal.readingtracker.domain.Book;
import br.edu.unifal.readingtracker.domain.Theme;
import br.edu.unifal.readingtracker.repository.BookRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class BookService {

    private final BookRepository bookRepository;
    private final AuthorService authorService;
    private final ThemeService themeService;

    public BookService(BookRepository bookRepository,
                       AuthorService authorService,
                       ThemeService themeService) {
        this.bookRepository = bookRepository;
        this.authorService = authorService;
        this.themeService = themeService;
    }

    @Transactional(readOnly = true)
    public List<Book> findAll() {
        return bookRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Book findById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Livro não encontrado com o ID: " + id));
    }

    @Transactional
    public Book create(Book book) {
        book.setId(null);
        book.setAuthors(resolveAuthors(book.getAuthors()));
        book.setThemes(resolveThemes(book.getThemes()));
        return bookRepository.save(book);
    }

    @Transactional
    public Book update(Long id, Book updatedBook) {
        Book existing = findById(id);
        existing.setTitle(updatedBook.getTitle());
        existing.setPublicationYear(updatedBook.getPublicationYear());
        existing.setForm(updatedBook.getForm());
        existing.setMode(updatedBook.getMode());
        existing.setContent(updatedBook.getContent());
        existing.setAuthors(resolveAuthors(updatedBook.getAuthors()));
        existing.setThemes(resolveThemes(updatedBook.getThemes()));
        return bookRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Book existing = findById(id);
        bookRepository.delete(existing);
    }

    private List<Author> resolveAuthors(List<Author> authors) {
        if (authors == null) {
            return new ArrayList<>();
        }
        List<Author> resolved = new ArrayList<>();
        for (Author author : authors) {
            if (author != null && author.getId() != null) {
                resolved.add(authorService.findById(author.getId()));
            }
        }
        return resolved;
    }

    private List<Theme> resolveThemes(List<Theme> themes) {
        if (themes == null) {
            return new ArrayList<>();
        }
        List<Theme> resolved = new ArrayList<>();
        for (Theme theme : themes) {
            if (theme != null && theme.getId() != null) {
                resolved.add(themeService.findById(theme.getId()));
            }
        }
        return resolved;
    }
}