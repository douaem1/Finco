package com.finco.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record BudgetRequest(

        @NotNull(message = "L'année est obligatoire.")
        @Min(value = 2000, message = "L'année doit être supérieure ou égale à 2000.")
        @Max(value = 2099, message = "L'année doit être inférieure ou égale à 2099.")
        Integer annee,

        @NotNull(message = "Le montant prévu est obligatoire.")
        @DecimalMin(value = "0.00", inclusive = true, message = "Le montant prévu doit être supérieur ou égal à zéro.")
        BigDecimal montantPrevu,

        @NotNull(message = "L'identifiant du centre de coûts est obligatoire.")
        Long centreCoutId
) {
}
