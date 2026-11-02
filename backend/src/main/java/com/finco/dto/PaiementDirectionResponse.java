package com.finco.dto;

import com.finco.entity.AllocationPaiement;
import com.finco.entity.Paiement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record PaiementDirectionResponse(
        Long id,
        LocalDate datePaiement,
        BigDecimal montant,
        String mode,
        boolean valide,
        String validePar,
        List<FacturePaiementResponse> factures
) {
    public static PaiementDirectionResponse depuis(Paiement paiement, List<AllocationPaiement> allocations) {
        return new PaiementDirectionResponse(
                paiement.getId(),
                paiement.getDatePaiement(),
                paiement.getMontant(),
                paiement.getMode().name(),
                paiement.getValidePar() != null,
                paiement.getValidePar() == null ? null : paiement.getValidePar().getNomComplet(),
                allocations.stream().map(FacturePaiementResponse::depuis).toList());
    }

    public record FacturePaiementResponse(Long id, String numero, String statut, BigDecimal montantAffecte) {
        private static FacturePaiementResponse depuis(AllocationPaiement allocation) {
            return new FacturePaiementResponse(
                    allocation.getFacture().getId(),
                    allocation.getFacture().getNumero(),
                    allocation.getFacture().getStatut().name(),
                    allocation.getMontantAffecte());
        }
    }
}
