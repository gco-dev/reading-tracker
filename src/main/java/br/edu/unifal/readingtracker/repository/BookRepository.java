package br.edu.unifal.readingtracker.repository;

import br.edu.unifal.readingtracker.domain.Book;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {
}