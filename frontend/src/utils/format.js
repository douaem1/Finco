/* Affichage uniquement (aucune règle métier). */

const formatMontant = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function montant(valeur) {
  return formatMontant.format(Number(valeur) || 0);
}

export function dateFr(iso) {
  if (!iso) return '';
  const [a, m, j] = iso.split('-');
  return `${j}/${m}/${a}`;
}

export function nomAffiche(utilisateur) {
  if (!utilisateur) return '';
  return `${utilisateur.prenom ?? ''} ${utilisateur.nom ?? ''}`.trim();
}

export function initiales(utilisateur) {
  return `${utilisateur?.prenom?.[0] ?? ''}${utilisateur?.nom?.[0] ?? ''}`.toUpperCase() || '?';
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
