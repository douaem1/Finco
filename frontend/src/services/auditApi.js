import api from './api';

/* Journal d'audit (réservé au rôle ADMIN côté serveur).
   On réutilise l'instance axios unique de l'application. */

/** Retire les paramètres vides pour ne pas polluer l'URL. */
function nettoyer(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );
}

export async function listerEvenements({
  page = 0,
  size = 20,
  dateFrom,
  dateTo,
  utilisateurId,
  action,
  categorie,
  entiteType,
  resultat,
  q,
} = {}) {
  const { data } = await api.get('/admin/audit', {
    params: nettoyer({ page, size, dateFrom, dateTo, utilisateurId, action, categorie, entiteType, resultat, q }),
  });
  return data;
}

export async function statistiques({ dateFrom, dateTo } = {}) {
  const { data } = await api.get('/admin/audit/statistiques', { params: nettoyer({ dateFrom, dateTo }) });
  return data;
}

export async function historiqueEntite(type, id) {
  const { data } = await api.get(`/admin/audit/entite/${type}/${id}`);
  return data;
}

export async function obtenirEvenement(id) {
  const { data } = await api.get(`/admin/audit/${id}`);
  return data;
}

export const CATEGORIES_AUDIT = {
  CONNEXION: 'Connexion',
  COMPTABILITE: 'Comptabilité',
  FACTURATION: 'Facturation',
  PAIEMENT: 'Paiement',
  CLOTURE: 'Clôture',
  CONTROLE_GESTION: 'Contrôle de gestion',
  ADMINISTRATION: 'Administration',
  EXPORT: 'Export',
};

export const RESULTATS_AUDIT = {
  SUCCES: 'Succès',
  ECHEC: 'Échec',
};

/* Libellés français des actions (mêmes valeurs que l'énumération serveur ActionAudit). */
export const ACTIONS_AUDIT = {
  CONNEXION_REUSSIE: 'Connexion réussie',
  CONNEXION_ECHOUEE: 'Connexion échouée',
  DECONNEXION: 'Déconnexion',
  PIECE_CREEE: 'Pièce créée',
  PIECE_VALIDEE: 'Pièce validée',
  FACTURE_CREEE: 'Facture créée',
  FACTURE_VALIDEE: 'Facture validée',
  FACTURE_PAYEE: 'Facture payée',
  PAIEMENT_CREE: 'Paiement créé',
  PAIEMENT_VALIDE: 'Paiement validé',
  PAIEMENT_REJETE: 'Paiement rejeté',
  EXERCICE_CLOTURE: 'Exercice clôturé',
  BUDGET_CREE: 'Budget créé',
  BUDGET_MODIFIE: 'Budget modifié',
  CENTRE_COUT_MODIFIE: 'Centre de coûts modifié',
  REPARTITION_COUTS: 'Répartition des coûts',
  UTILISATEUR_CREE: 'Utilisateur créé',
  UTILISATEUR_MODIFIE: 'Utilisateur modifié',
  ROLE_MODIFIE: 'Rôle modifié',
  UTILISATEUR_DESACTIVE: 'Utilisateur désactivé',
  COMPTE_COMPTABLE_MODIFIE: 'Compte comptable modifié',
  EXPORT_PDF: 'Export PDF',
  EXPORT_CSV: 'Export CSV',
};

/** Catégorie serveur d'une action (pour retrouver le libellé de la catégorie). */
export const CATEGORIE_PAR_ACTION = {
  CONNEXION_REUSSIE: 'CONNEXION',
  CONNEXION_ECHOUEE: 'CONNEXION',
  DECONNEXION: 'CONNEXION',
  PIECE_CREEE: 'COMPTABILITE',
  PIECE_VALIDEE: 'COMPTABILITE',
  FACTURE_CREEE: 'FACTURATION',
  FACTURE_VALIDEE: 'FACTURATION',
  FACTURE_PAYEE: 'FACTURATION',
  PAIEMENT_CREE: 'PAIEMENT',
  PAIEMENT_VALIDE: 'PAIEMENT',
  PAIEMENT_REJETE: 'PAIEMENT',
  EXERCICE_CLOTURE: 'CLOTURE',
  BUDGET_CREE: 'CONTROLE_GESTION',
  BUDGET_MODIFIE: 'CONTROLE_GESTION',
  CENTRE_COUT_MODIFIE: 'CONTROLE_GESTION',
  REPARTITION_COUTS: 'CONTROLE_GESTION',
  UTILISATEUR_CREE: 'ADMINISTRATION',
  UTILISATEUR_MODIFIE: 'ADMINISTRATION',
  ROLE_MODIFIE: 'ADMINISTRATION',
  UTILISATEUR_DESACTIVE: 'ADMINISTRATION',
  COMPTE_COMPTABLE_MODIFIE: 'ADMINISTRATION',
  EXPORT_PDF: 'EXPORT',
  EXPORT_CSV: 'EXPORT',
};
