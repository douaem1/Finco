package com.finco.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ClientRequest(
        @NotBlank(message = "Le nom du client est obligatoire.")
        @Size(max = 150, message = "Le nom ne doit pas dépasser 150 caractères.")
        String nom,

        @Size(max = 20, message = "L'ICE ne doit pas dépasser 20 caractères.")
        String ice,

        @Email(message = "L'adresse email est invalide.")
        @Size(max = 100, message = "L'email ne doit pas dépasser 100 caractères.")
        String email,

        @Size(max = 20, message = "Le téléphone ne doit pas dépasser 20 caractères.")
        String telephone,

        @DecimalMin(value = "0.00", inclusive = true, message = "Le plafond de crédit doit être supérieur ou égal à zéro.")
        BigDecimal plafondCredit
) {
}
