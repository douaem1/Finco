import { useEffect, useState } from 'react';
import { montant } from '../utils/format';

/**
 * Balance de comptable (élément visuel de FinCo).
 * Le fléau penche du côté le plus lourd (débit à gauche, crédit à droite)
 * et redevient horizontal — en vert — quand les deux totaux sont égaux.
 * Affichage uniquement : c'est le serveur qui valide l'équilibre.
 */
export default function Balance({ debit = 0, credit = 0, compacte = false }) {
  const max = Math.max(debit, credit, 1);
  const angle = Math.max(-11, Math.min(11, ((credit - debit) / max) * 11));
  const equilibre = debit > 0 && Math.abs(debit - credit) < 0.005;
  const rad = (angle * Math.PI) / 180;
  const bras = 88;
  const dyGauche = -bras * Math.sin(rad);
  const dyDroite = bras * Math.sin(rad);
  const dx = bras * (1 - Math.cos(rad));

  return (
    <figure className={`balance ${equilibre ? 'balance-ok' : ''} ${compacte ? 'balance-compacte' : ''}`}
      aria-label={equilibre ? 'Écriture équilibrée' : 'Écriture non équilibrée'}>
      <svg viewBox="0 0 240 150" role="img" aria-hidden="true">
        {/* pied */}
        <path className="balance-pied" d="M120 34 L120 132 M92 136 h56" />
        <circle className="balance-pivot" cx="120" cy="34" r="5" />
        {/* fléau */}
        <g className="balance-fleau" style={{ transform: `rotate(${angle}deg)` }}>
          <line x1="32" y1="34" x2="208" y2="34" />
        </g>
        {/* plateaux */}
        <g className="balance-plateau" style={{ transform: `translate(${dx}px, ${dyGauche}px)` }}>
          <path d="M32 34 L14 86 M32 34 L50 86" />
          <path className="balance-coupe" d="M8 86 h48 a24 10 0 0 1 -48 0z" />
        </g>
        <g className="balance-plateau" style={{ transform: `translate(${-dx}px, ${dyDroite}px)` }}>
          <path d="M208 34 L190 86 M208 34 L226 86" />
          <path className="balance-coupe" d="M184 86 h48 a24 10 0 0 1 -48 0z" />
        </g>
      </svg>
      <figcaption>
        <span><small>Débit</small><b className="chiffres">{montant(debit)}</b></span>
        <span className="balance-etat">{equilibre ? 'Équilibrée' : `Écart ${montant(Math.abs(debit - credit))}`}</span>
        <span><small>Crédit</small><b className="chiffres">{montant(credit)}</b></span>
      </figcaption>
    </figure>
  );
}

/**
 * Démonstration animée (accueil, connexion) : une écriture s'écrit ligne
 * par ligne et la balance réagit. Une seule fois ; immédiate si l'utilisateur
 * a demandé à réduire les animations.
 */
const LIGNES_DEMO = [
  { compte: '6136', libelle: 'Honoraires', centre: 'ADM', debit: 30000 },
  { compte: '34552', libelle: 'TVA récupérable', debit: 6000 },
  { compte: '4411', libelle: 'Fournisseurs', credit: 36000 },
];

export function EcritureAnimee({ inverse = false }) {
  const reduit = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [visibles, setVisibles] = useState(reduit ? LIGNES_DEMO.length : 0);

  useEffect(() => {
    if (visibles >= LIGNES_DEMO.length) return undefined;
    const minuterie = setTimeout(() => setVisibles((v) => v + 1), visibles === 0 ? 500 : 1100);
    return () => clearTimeout(minuterie);
  }, [visibles]);

  const lignes = LIGNES_DEMO.slice(0, visibles);
  const debit = lignes.reduce((t, l) => t + (l.debit || 0), 0);
  const credit = lignes.reduce((t, l) => t + (l.credit || 0), 0);

  return (
    <div className={`ecriture-animee ${inverse ? 'ecriture-inverse' : ''}`}>
      <Balance debit={debit} credit={credit} />
      <ol className="ecriture-lignes">
        {LIGNES_DEMO.map((l, i) => (
          <li key={l.compte} className={i < visibles ? 'visible' : ''}>
            <span className="ecriture-compte"><b>{l.compte}</b> {l.libelle}</span>
            {l.centre ? <span className="code-centre">{l.centre}</span> : <span />}
            <span className="chiffres">{l.debit ? montant(l.debit) : ''}</span>
            <span className="chiffres">{l.credit ? montant(l.credit) : ''}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
