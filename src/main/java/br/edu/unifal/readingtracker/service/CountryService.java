package br.edu.unifal.readingtracker.service;

import br.edu.unifal.readingtracker.domain.Country;
import br.edu.unifal.readingtracker.repository.CountryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CountryService {

    private final CountryRepository countryRepository;

    public CountryService(CountryRepository countryRepository) {
        this.countryRepository = countryRepository;
    }

    @Transactional(readOnly = true)
    public List<Country> findAll() {
        return countryRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Country findById(Long id) {
        return countryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "País não encontrado com o ID: " + id));
    }

    @Transactional
    public Country create(Country country) {
        country.setId(null);
        return countryRepository.save(country);
    }

    @Transactional
    public Country update(Long id, Country updatedCountry) {
        Country existing = findById(id);
        existing.setName(updatedCountry.getName());
        return countryRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Country existing = findById(id);
        countryRepository.delete(existing);
    }
}