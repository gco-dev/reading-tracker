package br.edu.unifal.readingtracker.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public class BookRequestDTO {

    @NotBlank(message = "O título é obrigatório")
    private String title;

    @NotNull(message = "O ano de publicação é obrigatório")
    private Integer publicationYear;

    @NotEmpty(message = "Informe ao menos um autor")
    private List<Long> authorIds;

    @NotEmpty(message = "Informe ao menos um tema")
    private List<Long> themeIds;

    private String status;
    private Integer yearRead;
    private Double grade;
    private Integer priority;

    public BookRequestDTO() {
    }

    public BookRequestDTO(String title, Integer publicationYear, List<Long> authorIds, List<Long> themeIds,
                          String status, Integer yearRead, Double grade, Integer priority) {
        this.title = title;
        this.publicationYear = publicationYear;
        this.authorIds = authorIds;
        this.themeIds = themeIds;
        this.status = status;
        this.yearRead = yearRead;
        this.grade = grade;
        this.priority = priority;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Integer getPublicationYear() {
        return publicationYear;
    }

    public void setPublicationYear(Integer publicationYear) {
        this.publicationYear = publicationYear;
    }

    public List<Long> getAuthorIds() {
        return authorIds;
    }

    public void setAuthorIds(List<Long> authorIds) {
        this.authorIds = authorIds;
    }

    public List<Long> getThemeIds() {
        return themeIds;
    }

    public void setThemeIds(List<Long> themeIds) {
        this.themeIds = themeIds;
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

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }
}