package com.finco.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;

/**
 * Événement du journal d'audit (table `audit_event`).
 *
 * IMMUABLE : une fois écrit, un événement n'est jamais modifié ni supprimé.
 * - {@link Immutable} demande à Hibernate d'ignorer les UPDATE ;
 * - la classe n'expose aucun setter (construction par builder uniquement) ;
 * - le repository n'expose ni update ni delete.
 *
 * Les colonnes utilisateurId / utilisateurNom / utilisateurRole sont des
 * SNAPSHOTS : elles survivent à la suppression de l'utilisateur (pas de
 * relation JPA forte).
 */
@Entity
@Immutable
@Table(name = "audit_event", indexes = {
        @Index(name = "idx_audit_date", columnList = "date_evenement"),
        @Index(name = "idx_audit_utilisateur_date", columnList = "utilisateur_id, date_evenement"),
        @Index(name = "idx_audit_entite", columnList = "entite_type, entite_id"),
        @Index(name = "idx_audit_action", columnList = "action")
})
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_evenement", nullable = false, updatable = false)
    private LocalDateTime dateEvenement;

    /** Nullable : un échec de connexion n'a pas d'utilisateur authentifié. */
    @Column(name = "utilisateur_id")
    private Long utilisateurId;

    @Column(name = "utilisateur_nom", length = 200)
    private String utilisateurNom;

    @Column(name = "utilisateur_role", length = 40)
    private String utilisateurRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ActionAudit action;

    @Column(name = "entite_type", length = 50)
    private String entiteType;

    @Column(name = "entite_id")
    private Long entiteId;

    @Column(name = "entite_reference", length = 255)
    private String entiteReference;

    @Column(name = "ancienne_valeur", columnDefinition = "TEXT")
    private String ancienneValeur;

    @Column(name = "nouvelle_valeur", columnDefinition = "TEXT")
    private String nouvelleValeur;

    @Column(length = 500)
    private String details;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ResultatAudit resultat;

    @Column(name = "adresse_ip", length = 45)
    private String adresseIp;

    @Column(name = "request_id", length = 36)
    private String requestId;

    protected AuditEvent() {
    }

    private AuditEvent(Builder builder) {
        this.dateEvenement = builder.dateEvenement != null ? builder.dateEvenement : LocalDateTime.now();
        this.utilisateurId = builder.utilisateurId;
        this.utilisateurNom = builder.utilisateurNom;
        this.utilisateurRole = builder.utilisateurRole;
        this.action = builder.action;
        this.entiteType = builder.entiteType;
        this.entiteId = builder.entiteId;
        this.entiteReference = builder.entiteReference;
        this.ancienneValeur = builder.ancienneValeur;
        this.nouvelleValeur = builder.nouvelleValeur;
        this.details = builder.details;
        this.resultat = builder.resultat != null ? builder.resultat : ResultatAudit.SUCCES;
        this.adresseIp = builder.adresseIp;
        this.requestId = builder.requestId;
    }

    @PrePersist
    void avantInsertion() {
        if (dateEvenement == null) {
            dateEvenement = LocalDateTime.now();
        }
        if (resultat == null) {
            resultat = ResultatAudit.SUCCES;
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public LocalDateTime getDateEvenement() {
        return dateEvenement;
    }

    public Long getUtilisateurId() {
        return utilisateurId;
    }

    public String getUtilisateurNom() {
        return utilisateurNom;
    }

    public String getUtilisateurRole() {
        return utilisateurRole;
    }

    public ActionAudit getAction() {
        return action;
    }

    public String getEntiteType() {
        return entiteType;
    }

    public Long getEntiteId() {
        return entiteId;
    }

    public String getEntiteReference() {
        return entiteReference;
    }

    public String getAncienneValeur() {
        return ancienneValeur;
    }

    public String getNouvelleValeur() {
        return nouvelleValeur;
    }

    public String getDetails() {
        return details;
    }

    public ResultatAudit getResultat() {
        return resultat;
    }

    public String getAdresseIp() {
        return adresseIp;
    }

    public String getRequestId() {
        return requestId;
    }

    /** Builder : seul moyen de construire un événement (aucun setter). */
    public static final class Builder {
        private LocalDateTime dateEvenement;
        private Long utilisateurId;
        private String utilisateurNom;
        private String utilisateurRole;
        private ActionAudit action;
        private String entiteType;
        private Long entiteId;
        private String entiteReference;
        private String ancienneValeur;
        private String nouvelleValeur;
        private String details;
        private ResultatAudit resultat;
        private String adresseIp;
        private String requestId;

        public Builder dateEvenement(LocalDateTime dateEvenement) {
            this.dateEvenement = dateEvenement;
            return this;
        }

        public Builder utilisateur(Long id, String nom, String role) {
            this.utilisateurId = id;
            this.utilisateurNom = nom;
            this.utilisateurRole = role;
            return this;
        }

        public Builder action(ActionAudit action) {
            this.action = action;
            return this;
        }

        public Builder entite(String type, Long id, String reference) {
            this.entiteType = type;
            this.entiteId = id;
            this.entiteReference = reference;
            return this;
        }

        public Builder ancienneValeur(String ancienneValeur) {
            this.ancienneValeur = ancienneValeur;
            return this;
        }

        public Builder nouvelleValeur(String nouvelleValeur) {
            this.nouvelleValeur = nouvelleValeur;
            return this;
        }

        public Builder details(String details) {
            this.details = details;
            return this;
        }

        public Builder resultat(ResultatAudit resultat) {
            this.resultat = resultat;
            return this;
        }

        public Builder adresseIp(String adresseIp) {
            this.adresseIp = adresseIp;
            return this;
        }

        public Builder requestId(String requestId) {
            this.requestId = requestId;
            return this;
        }

        public AuditEvent build() {
            return new AuditEvent(this);
        }
    }
}
