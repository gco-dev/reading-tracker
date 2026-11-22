package br.edu.unifal.readingtracker.controller;

import br.edu.unifal.readingtracker.domain.Reading;
import br.edu.unifal.readingtracker.service.ReadingService;
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
@RequestMapping("/api/readings")
@CrossOrigin(origins = "*")
public class ReadingController {

    private final ReadingService readingService;

    public ReadingController(ReadingService readingService) {
        this.readingService = readingService;
    }

    @GetMapping
    public ResponseEntity<List<Reading>> findAll() {
        return ResponseEntity.ok(readingService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reading> findById(@PathVariable Long id) {
        return ResponseEntity.ok(readingService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Reading> create(@RequestBody Reading reading) {
        Reading created = readingService.create(reading);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Reading> update(@PathVariable Long id, @RequestBody Reading reading) {
        Reading updated = readingService.update(id, reading);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        readingService.delete(id);
        return ResponseEntity.noContent().build();
    }
}