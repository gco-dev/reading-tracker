package br.edu.unifal.readingtracker.dto;

import jakarta.validation.constraints.*;

public class AuthorRequestDTO {

    @NotBlank(message = "O nome do autor é obrigatório")
    private String name;

    @NotNull(message = "O ID do país é obrigatório")
    private Long countryId;

    public AuthorRequestDTO() {
    }

    public AuthorRequestDTO(String name, Long countryId) {
        this.name = name;
        this.countryId = countryId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getCountryId() {
        return countryId;
    }

    public void setCountryId(Long countryId) {
        this.countryId = countryId;
    }
}