package com.finco.notification;

/**
 * Nature métier de la notification, utilisée par le frontend pour choisir l'icône et le libellé.
 */
public enum TypeNotification {
    PAIEMENT_A_VALIDER,
    PAIEMENT_VALIDE,
    PAIEMENT_REJETE,
    FACTURE_PAYEE,
    EXERCICE_CLOTURE,
    /** Réservé : détection des dépassements de budget (implémenté ultérieurement). */
    BUDGET_DEPASSE
}
