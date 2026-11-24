package br.edu.unifal.readingtracker.dto;

import jakarta.validation.constraints.*;

public class ReadingRequestDTO {

    @NotNull(message = "O ID do livro é obrigatório")
    private Long bookId;

    @NotBlank(message = "O status da leitura é obrigatório")
    private String status;

    @Min(value = -5000, message = "O ano de leitura deve ser igual ou superior a -5000 (a.C.)")

    @Max(value = 2027, message = "O ano de leitura não pode ultrapassar 2027")

    private Integer yearRead;

    @Min(value = 0, message = "A nota mínima é 0.0")
    @Max(value = 10, message = "A nota máxima é 10.0")

    private Double grade;

    public ReadingRequestDTO() {
    }

    public ReadingRequestDTO(Long bookId, String status, Integer yearRead, Double grade) {
        this.bookId = bookId;
        this.status = status;
        this.yearRead = yearRead;
        this.grade = grade;
    }

    public Long getBookId() {
        return bookId;
    }

    public void setBookId(Long bookId) {
        this.bookId = bookId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getYearRead() {
        return yearRead;
    }

    public void setYearRead(Integer yearRead) {
        this.yearRead = yearRead;
    }

    public Double getGrade() {
        return grade;
    }

    public void setGrade(Double grade) {
        this.grade = grade;
    }
}