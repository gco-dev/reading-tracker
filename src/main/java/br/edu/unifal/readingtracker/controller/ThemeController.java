package br.edu.unifal.readingtracker.controller;

import br.edu.unifal.readingtracker.domain.Theme;
import br.edu.unifal.readingtracker.service.ThemeService;
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
@RequestMapping("/api/themes")
@CrossOrigin(origins = "*")
public class ThemeController {

    private final ThemeService themeService;

    public ThemeController(ThemeService themeService) {
        this.themeService = themeService;
    }

    @GetMapping
    public ResponseEntity<List<Theme>> findAll() {
        return ResponseEntity.ok(themeService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Theme> findById(@PathVariable Long id) {
        return ResponseEntity.ok(themeService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Theme> create(@RequestBody Theme theme) {
        Theme created = themeService.create(theme);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Theme> update(@PathVariable Long id, @RequestBody Theme theme) {
        Theme updated = themeService.update(id, theme);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        themeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}