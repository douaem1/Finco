/* Affichage uniquement (aucune règle métier). */

const formatMontant = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatMADIntl = new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function montant(valeur) {
  return formatMontant.format(Number(valeur) || 0);
}

export function formatMAD(valeur) {
  return `${formatMADIntl.format(Number(valeur) || 0)} MAD`;
}

export function formatPct(valeur) {
  return `${Number(valeur || 0).toFixed(2).replace('.', ',')}%`;
}

export function dateFr(iso) {
  if (!iso) return '';
  const [a, m, j] = iso.split('-');
  return `${j}/${m}/${a}`;
}

export function nomAffiche(utilisateur) {
  if (!utilisateur) return '';
  const complet = `${utilisateur.prenom ?? ''} ${utilisateur.nom ?? ''}`.trim()
    || (utilisateur.nomComplet ?? '').trim();
  if (complet) return complet;
  const local = String(utilisateur.email ?? utilisateur.login ?? '').split('@')[0].trim();
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : '';
}

/** Première lettre utilisable d'un texte, sans accent, en majuscule (ou '' si vide). */
function premiereLettre(texte) {
  const propre = String(texte ?? '').trim();
  if (!propre) return '';
  const sansAccent = propre.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const lettre = (sansAccent || propre).charAt(0);
  return lettre ? lettre.toUpperCase() : '';
}

/**
 * Initiale unique d'un utilisateur pour l'avatar.
 * Ordre : prénom, nom/nomComplet, puis partie locale de l'email (ou login).
 * Ne casse jamais sur une valeur vide ; renvoie « ? » seulement si tout est vide.
 */
export function getInitial(utilisateur) {
  if (!utilisateur) return '?';
  const candidats = [
    utilisateur.prenom,
    utilisateur.nom,
    utilisateur.nomComplet,
    String(utilisateur.email ?? utilisateur.login ?? '').split('@')[0],
  ];
  for (const candidat of candidats) {
    const lettre = premiereLettre(candidat);
    if (lettre) return lettre;
  }
  return '?';
}

export function minutesSecondes(secondes) {
  const s = Math.max(0, Math.floor(secondes));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export const LIBELLES_ROLES = {
  COMPTABLE: 'Comptable',
  CONTROLEUR: 'Contrôleur de gestion',
  DIRECTEUR_FINANCIER: 'Directeur financier',
  ADMIN: 'Administrateur',
};
