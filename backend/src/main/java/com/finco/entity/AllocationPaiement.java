package com.finco.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * Entité d'allocation d'un paiement sur une facture (table paiement_facture).
 * Permet à un paiement de régler plusieurs factures et à une facture d'être réglée en plusieurs fois.
 */
@Entity
@Table(name = "paiement_facture")
public class AllocationPaiement {

    @EmbeddedId
    private AllocationPaiementId id = new AllocationPaiementId();

    @Column(name = "montant_affecte", nullable = false, precision = 15, scale = 2)
    private BigDecimal montantAffecte;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("paiementId")
    @JoinColumn(name = "paiement_id", nullable = false)
    private Paiement paiement;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("factureId")
    @JoinColumn(name = "facture_id", nullable = false)
    private Facture facture;

    public AllocationPaiement() {
    }

    public AllocationPaiement(BigDecimal montantAffecte, Paiement paiement, Facture facture) {
        this.montantAffecte = montantAffecte;
        this.paiement = paiement;
        this.facture = facture;
        this.id = new AllocationPaiementId(paiement.getId(), facture.getId());
    }

    public AllocationPaiementId getId() {
        return id;
    }

    public void setId(AllocationPaiementId id) {
        this.id = id;
    }

    public BigDecimal getMontantAffecte() {
        return montantAffecte;
    }

    public void setMontantAffecte(BigDecimal montantAffecte) {
        this.montantAffecte = montantAffecte;
    }

    public Paiement getPaiement() {
        return paiement;
    }

    public void setPaiement(Paiement paiement) {
        this.paiement = paiement;
        this.id.setPaiementId(paiement.getId());
    }

    public Facture getFacture() {
        return facture;
    }

    public void setFacture(Facture facture) {
        this.facture = facture;
        this.id.setFactureId(facture.getId());
    }
}
