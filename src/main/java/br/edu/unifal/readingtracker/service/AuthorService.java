package br.edu.unifal.readingtracker.service;

import br.edu.unifal.readingtracker.domain.Author;
import br.edu.unifal.readingtracker.domain.Country;
import br.edu.unifal.readingtracker.dto.AuthorRequestDTO;
import br.edu.unifal.readingtracker.repository.AuthorRepository;
import br.edu.unifal.readingtracker.repository.CountryRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthorService {

    private final AuthorRepository authorRepository;
    private final CountryRepository countryRepository;

    public AuthorService(AuthorRepository authorRepository, CountryRepository countryRepository) {
        this.authorRepository = authorRepository;
        this.countryRepository = countryRepository;
    }

    public List<Author> findAll() {
        return authorRepository.findAll();
    }

    public Author findById(Long id) {
        return authorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Autor não encontrado com ID: " + id));
    }

    @Transactional
    public Author create(AuthorRequestDTO dto) {
        Country country = countryRepository.findById(dto.getCountryId())
                .orElseThrow(() -> new EntityNotFoundException("País não encontrado com ID: " + dto.getCountryId()));

        Author author = new Author();
        author.setName(dto.getName());
        author.setCountry(country);

        return authorRepository.save(author);
    }
}