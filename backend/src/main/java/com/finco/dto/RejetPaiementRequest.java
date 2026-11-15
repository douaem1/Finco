package com.finco.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Corps de la requête de rejet d'un paiement. */
public record RejetPaiementRequest(
        @NotBlank(message = "Le motif du rejet est obligatoire.")
        @Size(min = 5, max = 500, message = "Le motif du rejet doit comporter entre 5 et 500 caractères.")
        String motif
) {
}
