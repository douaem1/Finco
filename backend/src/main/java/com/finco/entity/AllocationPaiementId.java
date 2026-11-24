package com.finco.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class AllocationPaiementId implements Serializable {

    @Column(name = "paiement_id")
    private Long paiementId;

    @Column(name = "facture_id")
    private Long factureId;

    public AllocationPaiementId() {
    }

    public AllocationPaiementId(Long paiementId, Long factureId) {
        this.paiementId = paiementId;
        this.factureId = factureId;
    }

    public Long getPaiementId() {
        return paiementId;
    }

    public void setPaiementId(Long paiementId) {
        this.paiementId = paiementId;
    }

    public Long getFactureId() {
        return factureId;
    }

    public void setFactureId(Long factureId) {
        this.factureId = factureId;
    }

    @Override
    public boolean equals(Object autre) {
        if (this == autre) return true;
        if (!(autre instanceof AllocationPaiementId that)) return false;
        return Objects.equals(paiementId, that.paiementId) && Objects.equals(factureId, that.factureId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(paiementId, factureId);
    }
}
