package br.edu.unifal.readingtracker.repository;

import br.edu.unifal.readingtracker.domain.Reading;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReadingRepository extends JpaRepository<Reading, Long> {

    List<Reading> findByBookId(Long bookId);

    void deleteByBookId(Long bookId);
}