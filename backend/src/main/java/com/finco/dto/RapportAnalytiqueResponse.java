package com.finco.dto;

import java.math.BigDecimal;
import java.util.List;

public record RapportAnalytiqueResponse(
        int annee,
        BigDecimal totalCharges,
        BigDecimal totalProduits,
        List<Centre> centres,
        List<Mois> evolution
) {
    public record Centre(
            Long centreId,
            String code,
            String libelle,
            BigDecimal budget,
            BigDecimal reel,
            BigDecimal ecart
    ) {
    }

    public record Mois(String mois, BigDecimal charges, BigDecimal produits) {
    }
}
