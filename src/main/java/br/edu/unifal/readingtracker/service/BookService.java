package br.edu.unifal.readingtracker.service;

import br.edu.unifal.readingtracker.domain.Author;
import br.edu.unifal.readingtracker.domain.Book;
import br.edu.unifal.readingtracker.domain.Reading;
import br.edu.unifal.readingtracker.domain.Theme;
import br.edu.unifal.readingtracker.dto.BookRequestDTO;
import br.edu.unifal.readingtracker.repository.AuthorRepository;
import br.edu.unifal.readingtracker.repository.BookRepository;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
import br.edu.unifal.readingtracker.repository.ThemeRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BookService {

    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final ThemeRepository themeRepository;
    private final ReadingRepository readingRepository;

    public BookService(BookRepository bookRepository,
                       AuthorRepository authorRepository,
                       ThemeRepository themeRepository,
                       ReadingRepository readingRepository) {
        this.bookRepository = bookRepository;
        this.authorRepository = authorRepository;
        this.themeRepository = themeRepository;
        this.readingRepository = readingRepository;
    }

    public List<Book> findAll() {
        return bookRepository.findAll();
    }

    public Book findById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Livro não encontrado com ID: " + id));
    }

    @Transactional
    public Book create(BookRequestDTO dto) {
        List<Author> authors = authorRepository.findAllById(dto.getAuthorIds());
        List<Theme> themes = themeRepository.findAllById(dto.getThemeIds());

        Book book = new Book();
        book.setTitle(dto.getTitle());
        book.setPublicationYear(dto.getPublicationYear());
        book.setAuthors(authors);
        book.setThemes(themes);

        Book savedBook = bookRepository.save(book);

        saveOrUpdateReading(savedBook, dto);

        return savedBook;
    }

    @Transactional
    public Book update(Long id, BookRequestDTO dto) {
        Book book = findById(id);

        List<Author> authors = authorRepository.findAllById(dto.getAuthorIds());
        List<Theme> themes = themeRepository.findAllById(dto.getThemeIds());

        book.setTitle(dto.getTitle());
        book.setPublicationYear(dto.getPublicationYear());
        book.setAuthors(authors);
        book.setThemes(themes);

        Book updatedBook = bookRepository.save(book);

        saveOrUpdateReading(updatedBook, dto);

        return updatedBook;
    }

    @Transactional
    public void delete(Long id) {
        if (!bookRepository.existsById(id)) {
            throw new EntityNotFoundException("Livro não encontrado com ID: " + id);
        }
        readingRepository.findById(id).ifPresent(readingRepository::delete);
        bookRepository.deleteById(id);
    }

    private void saveOrUpdateReading(Book book, BookRequestDTO dto) {
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            Reading reading = readingRepository.findById(book.getId())
                    .orElse(new Reading());

            reading.setBook(book);
            reading.setStatus(dto.getStatus());
            reading.setYearRead(dto.getYearRead());
            reading.setGrade(dto.getGrade());

            readingRepository.save(reading);
        }
    }
}