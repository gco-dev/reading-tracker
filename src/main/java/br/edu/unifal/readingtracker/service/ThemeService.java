package br.edu.unifal.readingtracker.service;

import br.edu.unifal.readingtracker.domain.Theme;
import br.edu.unifal.readingtracker.repository.ThemeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ThemeService {

    private final ThemeRepository themeRepository;

    public ThemeService(ThemeRepository themeRepository) {
        this.themeRepository = themeRepository;
    }

    @Transactional(readOnly = true)
    public List<Theme> findAll() {
        return themeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Theme findById(Long id) {
        return themeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Tema não encontrado com o ID: " + id));
    }

    @Transactional
    public Theme create(Theme theme) {
        theme.setId(null);
        return themeRepository.save(theme);
    }

    @Transactional
    public Theme update(Long id, Theme updatedTheme) {
        Theme existing = findById(id);
        existing.setName(updatedTheme.getName());
        return themeRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Theme existing = findById(id);
        themeRepository.delete(existing);
    }
}