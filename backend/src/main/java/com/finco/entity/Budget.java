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
 * Budget alloué à un centre de coûts pour un exercice donné (module CO).
 */
@Entity
@Table(name = "budget", uniqueConstraints = {
        @UniqueConstraint(name = "uk_budget_centre_annee", columnNames = {"centre_cout_id", "annee"})
})
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int annee;

    @Column(name = "montant_prevu", nullable = false, precision = 15, scale = 2)
    private BigDecimal montantPrevu;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "centre_cout_id", nullable = false)
    private CentreCout centreCout;

    public Budget() {
    }

    public Budget(int annee, BigDecimal montantPrevu, CentreCout centreCout) {
        this.annee = annee;
        this.montantPrevu = montantPrevu;
        this.centreCout = centreCout;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getAnnee() {
        return annee;
    }

    public void setAnnee(int annee) {
        this.annee = annee;
    }

    public BigDecimal getMontantPrevu() {
        return montantPrevu;
    }

    public void setMontantPrevu(BigDecimal montantPrevu) {
        this.montantPrevu = montantPrevu;
    }

    public CentreCout getCentreCout() {
        return centreCout;
    }

    public void setCentreCout(CentreCout centreCout) {
        this.centreCout = centreCout;
    }
}
