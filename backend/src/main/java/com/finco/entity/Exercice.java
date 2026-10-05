package com.finco.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

/**
 * Exercice comptable (table `exercice`), ex. 2026 du 01/01 au 31/12.
 * Une écriture ne peut être saisie que dans un exercice non clôturé.
 */
@Entity
@Table(name = "exercice")
public class Exercice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private int annee;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(nullable = false)
    private boolean cloture;

    public Exercice() {
    }

    public Exercice(int annee, LocalDate dateDebut, LocalDate dateFin) {
        this.annee = annee;
        this.dateDebut = dateDebut;
        this.dateFin = dateFin;
    }

    public Long getId() { return id; }
    public int getAnnee() { return annee; }
    public void setAnnee(int annee) { this.annee = annee; }
    public LocalDate getDateDebut() { return dateDebut; }
    public void setDateDebut(LocalDate dateDebut) { this.dateDebut = dateDebut; }
    public LocalDate getDateFin() { return dateFin; }
    public void setDateFin(LocalDate dateFin) { this.dateFin = dateFin; }
    public boolean isCloture() { return cloture; }
    public void setCloture(boolean cloture) { this.cloture = cloture; }
}
