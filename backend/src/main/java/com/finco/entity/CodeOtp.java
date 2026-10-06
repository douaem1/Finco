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

import java.time.LocalDateTime;

/**
 * Code à usage unique (OTP) envoyé par email après un mot de passe correct
 * (table `otp_connexion`). C'est la 2e étape de la connexion.
 *
 *  - jeton : identifiant aléatoire de la tentative de connexion, renvoyé au
 *    frontend à l'étape 1 et rappelé à l'étape 2 (il ne révèle rien) ;
 *  - codeHache : le code à 6 chiffres haché en BCrypt, jamais en clair ;
 *  - expireLe / tentatives / utilise : limitent la durée et le nombre d'essais.
 */
@Entity
@Table(name = "otp_connexion")
public class CodeOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(nullable = false, unique = true, length = 64)
    private String jeton;

    @Column(name = "code_hache", nullable = false, length = 100)
    private String codeHache;

    @Column(name = "envoye_le", nullable = false)
    private LocalDateTime envoyeLe;

    @Column(name = "expire_le", nullable = false)
    private LocalDateTime expireLe;

    @Column(nullable = false)
    private int tentatives;

    @Column(nullable = false)
    private boolean utilise;

    public CodeOtp() {
    }

    public CodeOtp(Utilisateur utilisateur, String jeton) {
        this.utilisateur = utilisateur;
        this.jeton = jeton;
    }

    /** Remplace le code (premier envoi ou renvoi) et remet le compteur à zéro. */
    public void nouveauCode(String codeHache, LocalDateTime maintenant, LocalDateTime expireLe) {
        this.codeHache = codeHache;
        this.envoyeLe = maintenant;
        this.expireLe = expireLe;
        this.tentatives = 0;
    }

    public boolean estExpire(LocalDateTime maintenant) {
        return maintenant.isAfter(expireLe);
    }

    public void ajouterTentative() {
        tentatives++;
    }

    public Long getId() { return id; }
    public Utilisateur getUtilisateur() { return utilisateur; }
    public String getJeton() { return jeton; }
    public String getCodeHache() { return codeHache; }
    public LocalDateTime getEnvoyeLe() { return envoyeLe; }
    public LocalDateTime getExpireLe() { return expireLe; }
    public int getTentatives() { return tentatives; }
    public boolean isUtilise() { return utilise; }
    public void setUtilise(boolean utilise) { this.utilise = utilise; }
}
