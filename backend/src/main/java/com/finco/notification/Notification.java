package com.finco.notification;

import com.finco.entity.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Notification destinée à un utilisateur unique.
 * Les entités liées (facture, paiement, exercice...) sont référencées par un couple
 * (entiteLieeType, entiteLieeId) sans relation JPA forte, pour rester découplé.
 */
@Entity
@Table(name = "notification", indexes = {
        @Index(name = "idx_notification_dest_lu_date",
                columnList = "destinataire_id, lu, date_creation")
})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "destinataire_id", nullable = false)
    private Utilisateur destinataire;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TypeNotification type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SeveriteNotification severite;

    @Column(nullable = false, length = 500)
    private String message;

    /** Route frontend à ouvrir au clic, ex. "/paiements". */
    @Column(length = 255)
    private String lien;

    @Column(nullable = false)
    private boolean lu = false;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @Column(name = "entite_liee_type", length = 50)
    private String entiteLieeType;

    @Column(name = "entite_liee_id")
    private Long entiteLieeId;

    public Notification() {
    }

    /** Renseigne l'horodatage juste avant l'INSERT si l'appelant ne l'a pas fait. */
    @PrePersist
    void avantInsertion() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Utilisateur getDestinataire() {
        return destinataire;
    }

    public void setDestinataire(Utilisateur destinataire) {
        this.destinataire = destinataire;
    }

    public TypeNotification getType() {
        return type;
    }

    public void setType(TypeNotification type) {
        this.type = type;
    }

    public SeveriteNotification getSeverite() {
        return severite;
    }

    public void setSeverite(SeveriteNotification severite) {
        this.severite = severite;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getLien() {
        return lien;
    }

    public void setLien(String lien) {
        this.lien = lien;
    }

    public boolean isLu() {
        return lu;
    }

    public void setLu(boolean lu) {
        this.lu = lu;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }

    public String getEntiteLieeType() {
        return entiteLieeType;
    }

    public void setEntiteLieeType(String entiteLieeType) {
        this.entiteLieeType = entiteLieeType;
    }

    public Long getEntiteLieeId() {
        return entiteLieeId;
    }

    public void setEntiteLieeId(Long entiteLieeId) {
        this.entiteLieeId = entiteLieeId;
    }
}
