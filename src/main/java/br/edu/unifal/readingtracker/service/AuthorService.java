package br.edu.unifal.readingtracker.service;

import br.edu.unifal.readingtracker.domain.Author;
import br.edu.unifal.readingtracker.domain.Country;
import br.edu.unifal.readingtracker.repository.AuthorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AuthorService {

    private final AuthorRepository authorRepository;
    private final CountryService countryService;

    public AuthorService(AuthorRepository authorRepository, CountryService countryService) {
        this.authorRepository = authorRepository;
        this.countryService = countryService;
    }

    @Transactional(readOnly = true)
    public List<Author> findAll() {
        return authorRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Author findById(Long id) {
        return authorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Autor não encontrado com o ID: " + id));
    }

    @Transactional
    public Author create(Author author) {
        author.setId(null);
        author.setCountry(resolveCountry(author.getCountry()));
        return authorRepository.save(author);
    }

    @Transactional
    public Author update(Long id, Author updatedAuthor) {
        Author existing = findById(id);
        existing.setName(updatedAuthor.getName());
        existing.setCountry(resolveCountry(updatedAuthor.getCountry()));
        return authorRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Author existing = findById(id);
        authorRepository.delete(existing);
    }

    private Country resolveCountry(Country country) {
        if (country == null || country.getId() == null) {
            return null;
        }
        return countryService.findById(country.getId());
    }
}