package br.edu.unifal.readingtracker.service;

import br.edu.unifal.readingtracker.domain.Book;
import br.edu.unifal.readingtracker.domain.Reading;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ReadingService {

    private final ReadingRepository readingRepository;
    private final BookService bookService;

    public ReadingService(ReadingRepository readingRepository, BookService bookService) {
        this.readingRepository = readingRepository;
        this.bookService = bookService;
    }

    @Transactional(readOnly = true)
    public List<Reading> findAll() {
        return readingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Reading findById(Long id) {
        return readingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Registro de leitura não encontrado com o ID: " + id));
    }

    @Transactional
    public Reading create(Reading reading) {
        reading.setId(null);
        reading.setBook(resolveBook(reading.getBook()));
        return readingRepository.save(reading);
    }

    @Transactional
    public Reading update(Long id, Reading updatedReading) {
        Reading existing = findById(id);
        existing.setBook(resolveBook(updatedReading.getBook()));
        existing.setStatus(updatedReading.getStatus());
        existing.setYearRead(updatedReading.getYearRead());
        existing.setGrade(updatedReading.getGrade());
        existing.setRecommendedBy(updatedReading.getRecommendedBy());
        existing.setPriority(updatedReading.getPriority());
        existing.setNotes(updatedReading.getNotes());
        return readingRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Reading existing = findById(id);
        readingRepository.delete(existing);
    }

    private Book resolveBook(Book book) {
        if (book == null || book.getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "O livro (book.id) é obrigatório para o registro de leitura.");
        }
        return bookService.findById(book.getId());
    }
}