package com.finco.entity;

import com.finco.entity.enums.ModePaiement;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Paiement émis ou reçu.
 */
@Entity
@Table(name = "paiement")
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_paiement", nullable = false)
    private LocalDate datePaiement;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal montant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ModePaiement mode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "valide_par")
    private Utilisateur validePar;

    /** Motif du rejet saisi par le directeur financier (null tant que le paiement n'est pas rejeté). */
    @Column(name = "motif_rejet", length = 500)
    private String motifRejet;

    @Column(name = "date_rejet")
    private LocalDateTime dateRejet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejete_par")
    private Utilisateur rejetePar;

    public Paiement() {
    }

    public Paiement(LocalDate datePaiement, BigDecimal montant, ModePaiement mode) {
        this.datePaiement = datePaiement;
        this.montant = montant;
        this.mode = mode;
    }

    public Paiement(LocalDate datePaiement, BigDecimal montant, ModePaiement mode, Utilisateur validePar) {
        this.datePaiement = datePaiement;
        this.montant = montant;
        this.mode = mode;
        this.validePar = validePar;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getDatePaiement() {
        return datePaiement;
    }

    public void setDatePaiement(LocalDate datePaiement) {
        this.datePaiement = datePaiement;
    }

    public BigDecimal getMontant() {
        return montant;
    }

    public void setMontant(BigDecimal montant) {
        this.montant = montant;
    }

    public ModePaiement getMode() {
        return mode;
    }

    public void setMode(ModePaiement mode) {
        this.mode = mode;
    }

    public Utilisateur getValidePar() {
        return validePar;
    }

    public void setValidePar(Utilisateur validePar) {
        this.validePar = validePar;
    }

    public String getMotifRejet() {
        return motifRejet;
    }

    public void setMotifRejet(String motifRejet) {
        this.motifRejet = motifRejet;
    }

    public LocalDateTime getDateRejet() {
        return dateRejet;
    }

    public void setDateRejet(LocalDateTime dateRejet) {
        this.dateRejet = dateRejet;
    }

    public Utilisateur getRejetePar() {
        return rejetePar;
    }

    public void setRejetePar(Utilisateur rejetePar) {
        this.rejetePar = rejetePar;
    }

    /** Un paiement est rejeté dès qu'un rejeteur y est rattaché. */
    public boolean isRejete() {
        return rejetePar != null;
    }
}
