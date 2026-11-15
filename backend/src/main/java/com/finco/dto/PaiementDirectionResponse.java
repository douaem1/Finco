package com.finco.dto;

import com.finco.entity.AllocationPaiement;
import com.finco.entity.Paiement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PaiementDirectionResponse(
        Long id,
        LocalDate datePaiement,
        BigDecimal montant,
        String mode,
        boolean valide,
        String validePar,
        boolean rejete,
        String motifRejet,
        LocalDateTime dateRejet,
        String rejetePar,
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
                paiement.getRejetePar() != null,
                paiement.getMotifRejet(),
                paiement.getDateRejet(),
                paiement.getRejetePar() == null ? null : paiement.getRejetePar().getNomComplet(),
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
