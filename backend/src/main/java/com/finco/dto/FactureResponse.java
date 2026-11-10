package com.finco.dto;

import com.finco.entity.Facture;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FactureResponse(
        Long id,
        String numero,
        LocalDate dateFacture,
        String type,
        BigDecimal montantHT,
        BigDecimal tauxTVA,
        BigDecimal montantTTC,
        String statut,
        Long tiersId,
        String tiersNom,
        String pieceNumero
) {
    public static FactureResponse depuis(Facture facture) {
        return new FactureResponse(
                facture.getId(),
                facture.getNumero(),
                facture.getDateFacture(),
                facture.getType().name(),
                facture.getMontantHT(),
                facture.getTauxTVA(),
                facture.calculerTTC(),
                facture.getStatut().name(),
                facture.getTiers().getId(),
                facture.getTiers().getNom(),
                facture.getPieceComptable() == null ? null : facture.getPieceComptable().getNumero());
    }
}
