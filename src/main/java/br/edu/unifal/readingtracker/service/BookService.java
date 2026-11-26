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
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
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
        return bookRepository.findAll(Sort.by(Sort.Direction.ASC, "title"));
    }

    public Book findById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Book not found with ID: " + id));
    }

    @Transactional
    public Book create(BookRequestDTO dto) {
        List<Author> authors = resolveAuthors(dto.getAuthorIds());
        List<Theme> themes = resolveThemes(dto.getThemeIds());

        Book book = new Book();
        book.setTitle(dto.getTitle());
        book.setPublicationYear(dto.getPublicationYear());
        book.setAuthors(authors);
        book.setThemes(themes);

        Book savedBook = bookRepository.save(book);

        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            if (dto.getYearRead() != null
                    && savedBook.getPublicationYear() != null
                    && dto.getYearRead() < savedBook.getPublicationYear()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Year read cannot be earlier than publication year.");
            }

            Reading reading = new Reading();
            reading.setBook(savedBook);
            reading.setStatus(dto.getStatus());
            reading.setYearRead(dto.getYearRead());
            reading.setGrade(dto.getGrade());
            reading.setPriority(dto.getPriority() != null ? String.valueOf(dto.getPriority()) : null);

            readingRepository.save(reading);
        }

        return savedBook;
    }

    @Transactional
    public Book update(Long id, BookRequestDTO dto) {
        Book book = findById(id);

        List<Author> authors = resolveAuthors(dto.getAuthorIds());
        List<Theme> themes = resolveThemes(dto.getThemeIds());

        book.setTitle(dto.getTitle());
        book.setPublicationYear(dto.getPublicationYear());
        book.setAuthors(authors);
        book.setThemes(themes);

        return bookRepository.save(book);
    }

    @Transactional
    public void delete(Long id) {
        bookRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Book not found with ID: " + id));

        readingRepository.deleteByBookId(id);
        bookRepository.deleteById(id);
    }

    private List<Author> resolveAuthors(List<Long> authorIds) {
        if (authorIds == null || authorIds.isEmpty()) {
            return new ArrayList<>();
        }
        if (authorIds.stream().anyMatch(Objects::isNull)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Author ID must not be null.");
        }

        List<Author> authors = authorRepository.findAllById(authorIds);
        Set<Long> foundIds = authors.stream()
                .map(Author::getId)
                .collect(Collectors.toSet());

        for (Long authorId : authorIds) {
            if (!foundIds.contains(authorId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Author not found with ID: " + authorId);
            }
        }

        return new ArrayList<>(authors);
    }

    private List<Theme> resolveThemes(List<Long> themeIds) {
        if (themeIds == null || themeIds.isEmpty()) {
            return new ArrayList<>();
        }
        if (themeIds.stream().anyMatch(Objects::isNull)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Theme ID must not be null.");
        }

        List<Theme> themes = themeRepository.findAllById(themeIds);
        Set<Long> foundIds = themes.stream()
                .map(Theme::getId)
                .collect(Collectors.toSet());

        for (Long themeId : themeIds) {
            if (!foundIds.contains(themeId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Theme not found with ID: " + themeId);
            }
        }

        return new ArrayList<>(themes);
    }
}