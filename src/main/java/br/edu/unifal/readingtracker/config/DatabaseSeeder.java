package br.edu.unifal.readingtracker.config;

import br.edu.unifal.readingtracker.domain.Author;
import br.edu.unifal.readingtracker.domain.Book;
import br.edu.unifal.readingtracker.domain.Country;
import br.edu.unifal.readingtracker.domain.Reading;
import br.edu.unifal.readingtracker.domain.Theme;
import br.edu.unifal.readingtracker.repository.AuthorRepository;
import br.edu.unifal.readingtracker.repository.BookRepository;
import br.edu.unifal.readingtracker.repository.CountryRepository;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
import br.edu.unifal.readingtracker.repository.ThemeRepository;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import tools.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final CountryRepository countryRepository;
    private final ThemeRepository themeRepository;
    private final AuthorRepository authorRepository;
    private final BookRepository bookRepository;
    private final ReadingRepository readingRepository;

    public DatabaseSeeder(CountryRepository countryRepository,
                          ThemeRepository themeRepository,
                          AuthorRepository authorRepository,
                          BookRepository bookRepository,
                          ReadingRepository readingRepository) {
        this.countryRepository = countryRepository;
        this.themeRepository = themeRepository;
        this.authorRepository = authorRepository;
        this.bookRepository = bookRepository;
        this.readingRepository = readingRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (bookRepository.count() > 0 || readingRepository.count() > 0) {
            System.out.println(">>> Banco H2 ja contem dados. Carga inicial ignorada.");
            return;
        }

        System.out.println(">>> Iniciando a carga inicial de dados a partir do seed.json...");

        ObjectMapper mapper = new ObjectMapper();
        InputStream inputStream = new ClassPathResource("seed.json").getInputStream();
        SeedData seedData = mapper.readValue(inputStream, SeedData.class);

        Map<Long, Country> countryMap = new HashMap<>();
        if (seedData.countries != null) {
            for (SeedCountry sc : seedData.countries) {
                Country country = countryRepository.findByName(sc.name)
                        .orElseGet(() -> countryRepository.save(new Country(null, sc.name)));
                countryMap.put(sc.id, country);
            }
        }

        Map<Long, Theme> themeMap = new HashMap<>();
        if (seedData.themes != null) {
            for (SeedTheme st : seedData.themes) {
                Theme theme = themeRepository.findByName(st.name)
                        .orElseGet(() -> themeRepository.save(new Theme(null, st.name)));
                themeMap.put(st.id, theme);
            }
        }

        Map<Long, Author> authorMap = new HashMap<>();
        if (seedData.authors != null) {
            for (SeedAuthor sa : seedData.authors) {
                Country country = sa.countryId != null ? countryMap.get(sa.countryId) : null;
                Author author = authorRepository.findByName(sa.name)
                        .orElseGet(() -> authorRepository.save(new Author(null, sa.name, country)));
                authorMap.put(sa.id, author);
            }
        }

        Map<Long, Book> bookMap = new HashMap<>();
        if (seedData.books != null) {
            for (SeedBook sb : seedData.books) {
                List<Author> bookAuthors = new ArrayList<>();
                if (sb.authorIds != null) {
                    for (Long authorId : sb.authorIds) {
                        Author author = authorMap.get(authorId);
                        if (author != null) {
                            bookAuthors.add(author);
                        }
                    }
                }

                List<Theme> bookThemes = new ArrayList<>();
                if (sb.themeIds != null) {
                    for (Long themeId : sb.themeIds) {
                        Theme theme = themeMap.get(themeId);
                        if (theme != null) {
                            bookThemes.add(theme);
                        }
                    }
                }

                Book book = new Book(
                        null,
                        sb.title,
                        sb.publicationYear,
                        sb.form,
                        sb.mode,
                        sb.content,
                        bookAuthors,
                        bookThemes
                );
                Book savedBook = bookRepository.save(book);
                bookMap.put(sb.id, savedBook);
            }
        }

        if (seedData.readings != null) {
            for (SeedReading sr : seedData.readings) {
                Book book = bookMap.get(sr.bookId);
                if (book != null) {
                    Reading reading = new Reading(
                            null,
                            book,
                            sr.status,
                            sr.yearRead,
                            sr.grade,
                            sr.recommendedBy,
                            sr.priority,
                            sr.notes
                    );
                    readingRepository.save(reading);
                }
            }
        }

        System.out.println(">>> Carga do seed.json realizada com sucesso no banco H2!");
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SeedData {
        public List<SeedCountry> countries;
        public List<SeedTheme> themes;
        public List<SeedAuthor> authors;
        public List<SeedBook> books;
        public List<SeedReading> readings;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SeedCountry {
        public Long id;
        public String name;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SeedTheme {
        public Long id;
        public String name;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SeedAuthor {
        public Long id;
        public String name;
        public Long countryId;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SeedBook {
        public Long id;
        public String title;
        public Integer publicationYear;
        public String form;
        public String mode;
        public String content;
        public List<Long> authorIds;
        public List<Long> themeIds;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SeedReading {
        public Long id;
        public Long bookId;
        public String status;
        public Integer yearRead;
        public Double grade;
        public String recommendedBy;
        public String priority;
        public String notes;
    }
}