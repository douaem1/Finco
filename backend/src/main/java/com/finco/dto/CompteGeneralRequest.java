package com.finco.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CompteGeneralRequest(
        @NotBlank(message = "Le numéro de compte est obligatoire.")
        @Pattern(regexp = "^[1-8][0-9]{1,9}$", message = "Le numéro de compte doit comporter entre 2 et 10 chiffres et commencer par un chiffre entre 1 et 8.")
        String numero,

        @NotBlank(message = "Le libellé du compte est obligatoire.")
        @Size(max = 150, message = "Le libellé ne doit pas dépasser 150 caractères.")
        String libelle
) {
}
