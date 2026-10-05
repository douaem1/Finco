package com.finco.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Pièce comptable (table `piece_comptable`) : l'en-tête d'une écriture.
 * Elle regroupe plusieurs lignes (débit / crédit) qui doivent s'équilibrer.
 *
 * Relation 1..* avec LigneEcriture :
 *  - cascade = ALL : enregistrer la pièce enregistre aussi ses lignes ;
 *  - orphanRemoval : retirer une ligne de la liste la supprime en base.
 */
@Entity
@Table(name = "piece_comptable")
public class PieceComptable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Généré par le service, ex. PC-2026-00001. */
    @Column(nullable = false, unique = true, length = 20)
    private String numero;

    @Column(name = "date_ecriture", nullable = false)
    private LocalDate dateEcriture;

    @Column(nullable = false, length = 255)
    private String libelle;

    /** false = brouillon (modifiable), true = validée (définitive). */
    @Column(nullable = false)
    private boolean validee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercice_id", nullable = false)
    private Exercice exercice;

    /** Utilisateur connecté qui a saisi la pièce (traçabilité). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @OneToMany(mappedBy = "piece", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<LigneEcriture> lignes = new ArrayList<>();

    public PieceComptable() {
    }

    @PrePersist
    void avantInsertion() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
    }

    /** Ajoute une ligne en maintenant les deux côtés de la relation. */
    public void ajouterLigne(LigneEcriture ligne) {
        ligne.setPiece(this);
        lignes.add(ligne);
    }

    public BigDecimal totalDebit() {
        return lignes.stream().filter(LigneEcriture::estAuDebit)
                .map(LigneEcriture::getMontant).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal totalCredit() {
        return lignes.stream().filter(l -> !l.estAuDebit())
                .map(LigneEcriture::getMontant).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public Long getId() { return id; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public LocalDate getDateEcriture() { return dateEcriture; }
    public void setDateEcriture(LocalDate dateEcriture) { this.dateEcriture = dateEcriture; }
    public String getLibelle() { return libelle; }
    public void setLibelle(String libelle) { this.libelle = libelle; }
    public boolean isValidee() { return validee; }
    public void setValidee(boolean validee) { this.validee = validee; }
    public Exercice getExercice() { return exercice; }
    public void setExercice(Exercice exercice) { this.exercice = exercice; }
    public Utilisateur getUtilisateur() { return utilisateur; }
    public void setUtilisateur(Utilisateur utilisateur) { this.utilisateur = utilisateur; }
    public LocalDateTime getDateCreation() { return dateCreation; }
    public List<LigneEcriture> getLignes() { return lignes; }
}
