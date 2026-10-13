package com.finco.entity;

import com.finco.entity.enums.StatutFacture;
import com.finco.entity.enums.TypeFacture;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

/**
 * Facture d'achat ou de vente liée à un tiers et potentiellement à une pièce comptable.
 */
@Entity
@Table(name = "facture", uniqueConstraints = {
        @UniqueConstraint(name = "uk_facture_tiers_numero", columnNames = {"tiers_id", "numero"})
})
public class Facture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String numero;

    @Column(name = "date_facture", nullable = false)
    private LocalDate dateFacture;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TypeFacture type;

    @Column(name = "montant_ht", nullable = false, precision = 15, scale = 2)
    private BigDecimal montantHT;

    @Column(name = "taux_tva", nullable = false, precision = 5, scale = 2)
    private BigDecimal tauxTVA = new BigDecimal("20.00");

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutFacture statut = StatutFacture.BROUILLON;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tiers_id", nullable = false)
    private Tiers tiers;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "piece_id", unique = true)
    private PieceComptable pieceComptable;

    public Facture() {
    }

    public Facture(String numero, LocalDate dateFacture, TypeFacture type, BigDecimal montantHT, BigDecimal tauxTVA, Tiers tiers) {
        this.numero = numero;
        this.dateFacture = dateFacture;
        this.type = type;
        this.montantHT = montantHT;
        this.tauxTVA = tauxTVA != null ? tauxTVA : new BigDecimal("20.00");
        this.tiers = tiers;
        this.statut = StatutFacture.BROUILLON;
    }

    /**
     * Calcule le montant TTC à partir du montant HT et du taux de TVA.
     * TTC = HT * (1 + tauxTVA / 100), arrondi à 2 décimales (HALF_UP).
     */
    public BigDecimal calculerTTC() {
        if (montantHT == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal taux = tauxTVA != null ? tauxTVA : BigDecimal.ZERO;
        BigDecimal facteurTva = BigDecimal.ONE.add(taux.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        return montantHT.multiply(facteurTva).setScale(2, RoundingMode.HALF_UP);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public LocalDate getDateFacture() {
        return dateFacture;
    }

    public void setDateFacture(LocalDate dateFacture) {
        this.dateFacture = dateFacture;
    }

    public TypeFacture getType() {
        return type;
    }

    public void setType(TypeFacture type) {
        this.type = type;
    }

    public BigDecimal getMontantHT() {
        return montantHT;
    }

    public void setMontantHT(BigDecimal montantHT) {
        this.montantHT = montantHT;
    }

    public BigDecimal getTauxTVA() {
        return tauxTVA;
    }

    public void setTauxTVA(BigDecimal tauxTVA) {
        this.tauxTVA = tauxTVA;
    }

    public StatutFacture getStatut() {
        return statut;
    }

    public void setStatut(StatutFacture statut) {
        this.statut = statut;
    }

    public Tiers getTiers() {
        return tiers;
    }

    public void setTiers(Tiers tiers) {
        this.tiers = tiers;
    }

    public PieceComptable getPieceComptable() {
        return pieceComptable;
    }

    public void setPieceComptable(PieceComptable pieceComptable) {
        this.pieceComptable = pieceComptable;
    }
}
