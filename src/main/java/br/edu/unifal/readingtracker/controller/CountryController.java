package br.edu.unifal.readingtracker.controller;

import br.edu.unifal.readingtracker.domain.Country;
import br.edu.unifal.readingtracker.service.CountryService;
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
@RequestMapping("/api/countries")
@CrossOrigin(origins = "*")
public class CountryController {

    private final CountryService countryService;

    public CountryController(CountryService countryService) {
        this.countryService = countryService;
    }

    @GetMapping
    public ResponseEntity<List<Country>> findAll() {
        return ResponseEntity.ok(countryService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Country> findById(@PathVariable Long id) {
        return ResponseEntity.ok(countryService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Country> create(@RequestBody Country country) {
        Country created = countryService.create(country);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Country> update(@PathVariable Long id, @RequestBody Country country) {
        Country updated = countryService.update(id, country);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        countryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}