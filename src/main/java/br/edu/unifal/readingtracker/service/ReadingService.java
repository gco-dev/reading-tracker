package br.edu.unifal.readingtracker.service;

import br.edu.unifal.readingtracker.domain.Book;
import br.edu.unifal.readingtracker.domain.Reading;
import br.edu.unifal.readingtracker.dto.ReadingRequestDTO;
import br.edu.unifal.readingtracker.repository.BookRepository;
import br.edu.unifal.readingtracker.repository.ReadingRepository;
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
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Book not found with ID: " + dto.getBookId()));

        // Validação: Ano de leitura não pode ser anterior ao ano de publicação do livro
        if (dto.getYearRead() != null && book.getPublicationYear() != null
                && dto.getYearRead() < book.getPublicationYear()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Year read (" + dto.getYearRead() + ") cannot be earlier than publication year ("
                            + book.getPublicationYear() + ").");
        }

        Reading reading;
        if (dto.getId() != null) {
            reading = readingRepository.findById(dto.getId())
                    .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.NOT_FOUND,
                            "Reading record not found with ID: " + dto.getId()));
        } else {
            reading = new Reading();
        }

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