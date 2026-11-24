package br.edu.unifal.readingtracker.controller;

import br.edu.unifal.readingtracker.config.DatabaseSeeder;
import br.edu.unifal.readingtracker.repository.AuthorRepository;
import br.edu.unifal.readingtracker.repository.BookRepository;
import br.edu.unifal.readingtracker.repository.CountryRepository;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
import br.edu.unifal.readingtracker.repository.ThemeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ResetController {

    private final ReadingRepository readingRepository;
    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final ThemeRepository themeRepository;
    private final CountryRepository countryRepository;
    private final DatabaseSeeder databaseSeeder;

    public ResetController(
            ReadingRepository readingRepository,
            BookRepository bookRepository,
            AuthorRepository authorRepository,
            ThemeRepository themeRepository,
            CountryRepository countryRepository,
            DatabaseSeeder databaseSeeder
    ) {
        this.readingRepository = readingRepository;
        this.bookRepository = bookRepository;
        this.authorRepository = authorRepository;
        this.themeRepository = themeRepository;
        this.countryRepository = countryRepository;
        this.databaseSeeder = databaseSeeder;
    }

    @PostMapping("/reset")
    @Transactional
    public ResponseEntity<Map<String, String>> resetDatabase() throws Exception {
        readingRepository.deleteAll();
        bookRepository.deleteAll();
        authorRepository.deleteAll();
        themeRepository.deleteAll();
        countryRepository.deleteAll();

        databaseSeeder.run();

        return ResponseEntity.ok(Map.of("message", "Banco H2 restaurado com sucesso para os dados originais do seed.json!"));
    }
}