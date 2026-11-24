package br.edu.unifal.readingtracker.controller;

import br.edu.unifal.readingtracker.domain.Author;
import br.edu.unifal.readingtracker.dto.AuthorRequestDTO;
import br.edu.unifal.readingtracker.service.AuthorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/authors")
@CrossOrigin(origins = "*")
public class AuthorController {

    private final AuthorService authorService;

    public AuthorController(AuthorService authorService) {
        this.authorService = authorService;
    }

    @GetMapping
    public ResponseEntity<List<Author>> getAllAuthors() {
        return ResponseEntity.ok(authorService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Author> getAuthorById(@PathVariable Long id) {
        return ResponseEntity.ok(authorService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Author> createAuthor(@Valid @RequestBody AuthorRequestDTO dto) {
        Author savedAuthor = authorService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedAuthor);
    }
}