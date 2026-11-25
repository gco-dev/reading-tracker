package br.edu.unifal.readingtracker.dto;

import jakarta.validation.constraints.*;

public class ReadingRequestDTO {

private Long id;

@NotNull(message = "Book ID is required")
private Long bookId;

@NotBlank(message = "Reading status is required")
private String status;

@Min(value = -5000, message = "Year read must be -5000 (BC) or later")
@Max(value = 2027, message = "Year read cannot be in the future")
private Integer yearRead;

@Min(value = 0, message = "Minimum grade is 0.0")
@Max(value = 10, message = "Maximum grade is 10.0")
private Double grade;

public ReadingRequestDTO() {
}

public ReadingRequestDTO(Long id, Long bookId, String status, Integer yearRead, Double grade) {
this.id = id;
this.bookId = bookId;
this.status = status;
this.yearRead = yearRead;
this.grade = grade;
}

public Long getId() {
return id;
}

public void setId(Long id) {
this.id = id;
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