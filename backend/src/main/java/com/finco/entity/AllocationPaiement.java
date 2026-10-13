package com.finco.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;

/**
 * Entité d'allocation d'un paiement sur une facture (table allocation_paiement).
 * Permet à un paiement de régler plusieurs factures et à une facture d'être réglée en plusieurs fois.
 */
@Entity
@Table(name = "allocation_paiement", uniqueConstraints = {
        @UniqueConstraint(name = "uk_allocation_paiement_facture", columnNames = {"paiement_id", "facture_id"})
})
public class AllocationPaiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "montant_affecte", nullable = false, precision = 15, scale = 2)
    private BigDecimal montantAffecte;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paiement_id", nullable = false)
    private Paiement paiement;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "facture_id", nullable = false)
    private Facture facture;

    public AllocationPaiement() {
    }

    public AllocationPaiement(BigDecimal montantAffecte, Paiement paiement, Facture facture) {
        this.montantAffecte = montantAffecte;
        this.paiement = paiement;
        this.facture = facture;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
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
    }

    public Facture getFacture() {
        return facture;
    }

    public void setFacture(Facture facture) {
        this.facture = facture;
    }
}
