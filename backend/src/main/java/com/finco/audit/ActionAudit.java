package com.finco.audit;

/**
 * Action auditée. Chaque valeur porte son libellé français (affichage)
 * et sa catégorie (filtrage + couleur de badge).
 */
public enum ActionAudit {

    // --- Connexion ---
    CONNEXION_REUSSIE("Connexion réussie", CategorieAudit.CONNEXION),
    CONNEXION_ECHOUEE("Connexion échouée", CategorieAudit.CONNEXION),
    DECONNEXION("Déconnexion", CategorieAudit.CONNEXION),

    // --- Comptabilité ---
    PIECE_CREEE("Pièce créée", CategorieAudit.COMPTABILITE),
    PIECE_VALIDEE("Pièce validée", CategorieAudit.COMPTABILITE),

    // --- Facturation ---
    FACTURE_CREEE("Facture créée", CategorieAudit.FACTURATION),
    FACTURE_VALIDEE("Facture validée", CategorieAudit.FACTURATION),
    FACTURE_PAYEE("Facture payée", CategorieAudit.FACTURATION),

    // --- Paiement ---
    PAIEMENT_CREE("Paiement créé", CategorieAudit.PAIEMENT),
    PAIEMENT_VALIDE("Paiement validé", CategorieAudit.PAIEMENT),
    PAIEMENT_REJETE("Paiement rejeté", CategorieAudit.PAIEMENT),

    // --- Clôture ---
    EXERCICE_CLOTURE("Exercice clôturé", CategorieAudit.CLOTURE),

    // --- Contrôle de gestion ---
    BUDGET_CREE("Budget créé", CategorieAudit.CONTROLE_GESTION),
    BUDGET_MODIFIE("Budget modifié", CategorieAudit.CONTROLE_GESTION),
    CENTRE_COUT_MODIFIE("Centre de coûts modifié", CategorieAudit.CONTROLE_GESTION),
    REPARTITION_COUTS("Répartition des coûts", CategorieAudit.CONTROLE_GESTION),

    // --- Administration ---
    UTILISATEUR_CREE("Utilisateur créé", CategorieAudit.ADMINISTRATION),
    UTILISATEUR_MODIFIE("Utilisateur modifié", CategorieAudit.ADMINISTRATION),
    ROLE_MODIFIE("Rôle modifié", CategorieAudit.ADMINISTRATION),
    UTILISATEUR_DESACTIVE("Utilisateur désactivé", CategorieAudit.ADMINISTRATION),
    COMPTE_COMPTABLE_MODIFIE("Compte comptable modifié", CategorieAudit.ADMINISTRATION),

    // --- Export ---
    EXPORT_PDF("Export PDF", CategorieAudit.EXPORT),
    EXPORT_CSV("Export CSV", CategorieAudit.EXPORT);

    private final String libelle;
    private final CategorieAudit categorie;

    ActionAudit(String libelle, CategorieAudit categorie) {
        this.libelle = libelle;
        this.categorie = categorie;
    }

    public String libelle() {
        return libelle;
    }

    public CategorieAudit categorie() {
        return categorie;
    }
}
