/**
 * Logo FinCo.
 * Tampon corail bordé d'encre (style « papier & encre »). Le « F » est fait
 * de deux barres de même longueur : un signe « = » (débit = crédit).
 * Le point sarcelle évoque un solde à zéro.
 */
export function LogoMarque({ taille = 36, inverse = false }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      {/* ombre décalée (encre), puis tampon corail bordé d'encre */}
      <rect x="4" y="4" width="34" height="34" rx="9" fill="#221D16" />
      <rect x="1.5" y="1.5" width="34" height="34" rx="9" fill={inverse ? '#FFFDF7' : '#FF6B57'} stroke="#221D16" strokeWidth="2" />
      <rect x="11" y="9" width="4.6" height="19" rx="1.2" fill={inverse ? '#221D16' : '#FFFDF7'} />
      <rect x="11" y="9" width="15.5" height="4.6" rx="1.2" fill={inverse ? '#221D16' : '#FFFDF7'} />
      <rect x="11" y="16.6" width="15.5" height="4.6" rx="1.2" fill={inverse ? '#221D16' : '#FFFDF7'} />
      <circle cx="25" cy="26" r="2.5" fill="#12A5A0" stroke="#221D16" strokeWidth="1.2" />
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
