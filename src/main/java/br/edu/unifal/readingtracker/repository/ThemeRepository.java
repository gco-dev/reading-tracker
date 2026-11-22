package br.edu.unifal.readingtracker.repository;

import br.edu.unifal.readingtracker.domain.Theme;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ThemeRepository extends JpaRepository<Theme, Long> {

    Optional<Theme> findByName(String name);
}