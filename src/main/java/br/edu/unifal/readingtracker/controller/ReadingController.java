package br.edu.unifal.readingtracker.controller;

import br.edu.unifal.readingtracker.domain.Reading;
import br.edu.unifal.readingtracker.dto.ReadingRequestDTO;
import br.edu.unifal.readingtracker.service.ReadingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<List<Reading>> getAllReadings() {
        return ResponseEntity.ok(readingService.findAll());
    }

    @PostMapping
    public ResponseEntity<Reading> createOrUpdateReading(@Valid @RequestBody ReadingRequestDTO dto) {
        Reading savedReading = readingService.createOrUpdate(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedReading);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReading(@PathVariable Long id) {
        readingService.delete(id);
        return ResponseEntity.noContent().build();
    }
}