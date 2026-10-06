/**
 * Logo FinCo.
 * Le « F » est dessiné avec deux barres de même longueur : elles forment
 * aussi un signe « = » (débit = crédit). Le petit carré vert en bas à droite
 * évoque un solde à zéro : l'écriture est équilibrée.
 *
 * variante : "clair" (sur fond blanc) ou "inverse" (sur fond bleu).
 */
export function LogoMarque({ taille = 36, inverse = false }) {
  const fond = inverse ? '#FFFFFF' : '#12304F';
  const trait = inverse ? '#12304F' : '#FFFFFF';
  return (
    <svg width={taille} height={taille} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="9" fill={fond} />
      <rect x="11" y="9" width="5" height="22" fill={trait} />
      <rect x="11" y="9" width="18" height="5" fill={trait} />
      <rect x="11" y="18" width="18" height="5" fill={trait} />
      <rect x="24.5" y="26.5" width="4.5" height="4.5" fill="#3FB68B" />
    </svg>
  );
}

export default function Logo({ variante = 'clair', avecSlogan = true, taille = 36 }) {
  const inverse = variante === 'inverse';
  return (
    <span className={`logo ${inverse ? 'logo-inverse' : ''}`}>
      <LogoMarque taille={taille} inverse={inverse} />
      <span className="logo-texte">
        <span className="logo-nom">FinCo</span>
        {avecSlogan && <span className="logo-slogan">Finance &amp; contrôle de gestion</span>}
      </span>
    </span>
  );
}
