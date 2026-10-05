package com.finco.entity;

import com.finco.entity.enums.Sens;
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

/**
 * Ligne d'écriture (table `ligne_ecriture`) : un compte, un sens, un montant.
 * Le centre de coûts est facultatif en base mais OBLIGATOIRE pour les comptes
 * de charges (classe 6) : cette règle est contrôlée par PieceComptableService.
 *
 * Les montants sont en BigDecimal (jamais double) pour éviter les erreurs
 * d'arrondi : 0.1 + 0.2 = 0.30000000000000004 en double !
 */
@Entity
@Table(name = "ligne_ecriture")
public class LigneEcriture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "piece_id", nullable = false)
    private PieceComptable piece;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "compte_id", nullable = false)
    private CompteGeneral compte;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "centre_cout_id")
    private CentreCout centreCout;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 6)
    private Sens sens;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal montant;

    public LigneEcriture() {
    }

    public LigneEcriture(CompteGeneral compte, CentreCout centreCout, Sens sens, BigDecimal montant) {
        this.compte = compte;
        this.centreCout = centreCout;
        this.sens = sens;
        this.montant = montant;
    }

    public boolean estAuDebit() {
        return sens == Sens.DEBIT;
    }

    public Long getId() { return id; }
    public PieceComptable getPiece() { return piece; }
    public void setPiece(PieceComptable piece) { this.piece = piece; }
    public CompteGeneral getCompte() { return compte; }
    public void setCompte(CompteGeneral compte) { this.compte = compte; }
    public CentreCout getCentreCout() { return centreCout; }
    public void setCentreCout(CentreCout centreCout) { this.centreCout = centreCout; }
    public Sens getSens() { return sens; }
    public void setSens(Sens sens) { this.sens = sens; }
    public BigDecimal getMontant() { return montant; }
    public void setMontant(BigDecimal montant) { this.montant = montant; }
}
