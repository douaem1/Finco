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

export const LIBELLES_ROLES = {
  COMPTABLE: 'Comptable',
  CONTROLEUR: 'Contrôleur de gestion',
  DIRECTEUR_FINANCIER: 'Directeur financier',
  ADMIN: 'Administrateur',
};
