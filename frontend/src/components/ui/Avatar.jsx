import { getInitial } from '../../utils/format';

/** Nombre de teintes d'accent (les valeurs sont définies dans app.css). */
const NB_TEINTES = 6;

/** Index de teinte stable pour un utilisateur donné (même couleur à chaque rendu). */
function teinteDeterministe(graine) {
  const texte = String(graine || '?');
  let somme = 0;
  for (let index = 0; index < texte.length; index += 1) somme += texte.charCodeAt(index);
  return somme % NB_TEINTES;
}

/**
 * Pastille d'avatar réutilisable : une seule lettre (via getInitial) sur une
 * teinte d'accent déterministe. À utiliser partout où un avatar est affiché.
 */
export default function Avatar({ utilisateur, grand = false, className = '' }) {
  const teinte = teinteDeterministe(utilisateur?.email || utilisateur?.nom || utilisateur?.prenom);
  const classes = `profil-avatar${grand ? ' profil-avatar-grand' : ''}${className ? ` ${className}` : ''}`;
  return (
    <span className={classes} data-teinte={teinte} aria-hidden="true">
      {getInitial(utilisateur)}
    </span>
  );
}
