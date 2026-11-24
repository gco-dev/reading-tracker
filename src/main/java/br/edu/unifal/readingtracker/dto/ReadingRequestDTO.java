package br.edu.unifal.readingtracker.dto;

import jakarta.validation.constraints.*;

public class ReadingRequestDTO {

    @NotNull(message = "O ID do livro é obrigatório")
    private Long bookId;

    @NotBlank(message = "O status da leitura é obrigatório")
    private String status;

    private Integer yearRead;
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