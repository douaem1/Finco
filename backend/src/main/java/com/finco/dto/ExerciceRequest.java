package com.finco.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ExerciceRequest(

        @NotNull(message = "L'année est obligatoire.")
        @Min(value = 2000, message = "L'année doit être supérieure ou égale à 2000.")
        @Max(value = 2099, message = "L'année doit être inférieure ou égale à 2099.")
        Integer annee,

        @NotNull(message = "La date de début est obligatoire.")
        LocalDate dateDebut,

        @NotNull(message = "La date de fin est obligatoire.")
        LocalDate dateFin,

        /** Facultatif — identifiant de la société propriétaire de l'exercice. */
        Long societeId
) {
}
