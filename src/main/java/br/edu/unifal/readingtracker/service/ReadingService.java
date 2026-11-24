package br.edu.unifal.readingtracker.service;

import br.edu.unifal.readingtracker.domain.Book;
import br.edu.unifal.readingtracker.domain.Reading;
import br.edu.unifal.readingtracker.dto.ReadingRequestDTO;
import br.edu.unifal.readingtracker.repository.BookRepository;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReadingService {

    private final ReadingRepository readingRepository;
    private final BookRepository bookRepository;

    public ReadingService(ReadingRepository readingRepository, BookRepository bookRepository) {
        this.readingRepository = readingRepository;
        this.bookRepository = bookRepository;
    }

    public List<Reading> findAll() {
        return readingRepository.findAll();
    }

    @Transactional
    public Reading createOrUpdate(ReadingRequestDTO dto) {
        Book book = bookRepository.findById(dto.getBookId())
                .orElseThrow(() -> new EntityNotFoundException("Livro não encontrado com ID: " + dto.getBookId()));

        Reading reading = readingRepository.findById(book.getId())
                .orElse(new Reading());

        reading.setBook(book);
        reading.setStatus(dto.getStatus());
        reading.setYearRead(dto.getYearRead());
        reading.setGrade(dto.getGrade());

        return readingRepository.save(reading);
    }

    @Transactional
    public void delete(Long id) {
        readingRepository.deleteById(id);
    }
}