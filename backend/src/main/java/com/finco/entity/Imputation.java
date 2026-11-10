package com.finco.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "imputation")
public class Imputation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 7)
    private String periode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "centre_source_id", nullable = false)
    private CentreCout centreSource;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "centre_cible_id", nullable = false)
    private CentreCout centreCible;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal montant;

    @Column(name = "date_calcul", nullable = false, updatable = false)
    private LocalDateTime dateCalcul;

    public Imputation() {
    }

    public Imputation(String periode, CentreCout centreSource, CentreCout centreCible, BigDecimal montant) {
        this.periode = periode;
        this.centreSource = centreSource;
        this.centreCible = centreCible;
        this.montant = montant;
    }

    @PrePersist
    void avantInsertion() {
        if (dateCalcul == null) dateCalcul = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getPeriode() { return periode; }
    public CentreCout getCentreSource() { return centreSource; }
    public CentreCout getCentreCible() { return centreCible; }
    public BigDecimal getMontant() { return montant; }
    public LocalDateTime getDateCalcul() { return dateCalcul; }
}
