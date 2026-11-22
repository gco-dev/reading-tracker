package br.edu.unifal.readingtracker.controller;

import br.edu.unifal.readingtracker.domain.Author;
import br.edu.unifal.readingtracker.service.AuthorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<List<Author>> findAll() {
        return ResponseEntity.ok(authorService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Author> findById(@PathVariable Long id) {
        return ResponseEntity.ok(authorService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Author> create(@RequestBody Author author) {
        Author created = authorService.create(author);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Author> update(@PathVariable Long id, @RequestBody Author author) {
        Author updated = authorService.update(id, author);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        authorService.delete(id);
        return ResponseEntity.noContent().build();
    }
}