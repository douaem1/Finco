/**
 * Logo FinCo — design « E ».
 * Icône : trois pastilles horizontales alignées à gauche (corail / jaune / sarcelle).
 * Marque : « FinCo » en Fraunces 700 suivi d'un soulignement de trois pastilles.
 * Variante « icone » : uniquement les pastilles (sidebar repliée, favicon).
 */

const PASTILLES = [
  { y: 0, largeur: 52, rembourrage: 'var(--corail)' },
  { y: 22, largeur: 38, rembourrage: 'var(--jaune)' },
  { y: 44, largeur: 24, rembourrage: 'var(--sarcelle)' },
];

function IconePastilles({ taille }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 56 56" aria-hidden="true" focusable="false">
      {PASTILLES.map((p) => (
        <rect key={p.y} x="0" y={p.y} width={p.largeur} height="12" rx="6" fill={p.rembourrage} />
      ))}
    </svg>
  );
}

export default function Logo({ variante = 'complet', taille = 40, className = '' }) {
  const iconeSeule = variante === 'icone';
  return (
    <span
      className={`logo-finco ${iconeSeule ? 'logo-finco-icone' : ''} ${className}`.trim()}
      role="img"
      aria-label="FinCo"
      style={{ gap: iconeSeule ? undefined : `calc(0.6 * ${taille}px)` }}
    >
      <IconePastilles taille={taille} />
      {!iconeSeule && (
        <span className="logo-finco-marque" aria-hidden="true" style={{ fontSize: `calc(0.9 * ${taille}px)` }}>
          <span className="logo-finco-nom">FinCo</span>
          <span className="logo-finco-souligne">
            <span className="logo-finco-pastille logo-finco-pastille-corail" />
            <span className="logo-finco-pastille logo-finco-pastille-jaune" />
            <span className="logo-finco-pastille logo-finco-pastille-sarcelle" />
          </span>
        </span>
      )}
    </span>
  );
}
