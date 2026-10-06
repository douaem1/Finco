import { useEffect, useId, useRef, useState } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { montant } from '../utils/format';
import { Compteur, EASE_EXPO } from './animation/Mouvement';

/* Deux tracés à la même structure (M L L) : un trait plat (en attente / écart)
   qui se transforme en coche (équilibrée) par morphing SVG. */
const TRACE_ATTENTE = 'M5 12 L11 12 L19 12';
const TRACE_COCHE = 'M5 12.5 L10 17 L19 7.5';

/**
 * Balance de comptable, version « fintech » : fléau et colonne en dégradé,
 * plateaux en relief, ombre portée. Le fléau penche du côté le plus lourd
 * (débit à gauche, crédit à droite) et se stabilise quand les totaux sont égaux.
 * Affichage uniquement : c'est le serveur qui valide l'équilibre.
 */
export default function Balance({ debit = 0, credit = 0, compacte = false, inverse = false }) {
  const id = useId().replace(/:/g, '');
  const max = Math.max(debit, credit, 1);
  const angle = Math.max(-9, Math.min(9, ((credit - debit) / max) * 9));
  const equilibre = debit > 0 && Math.abs(debit - credit) < 0.005;
  const rad = (angle * Math.PI) / 180;
  const bras = 74;
  const dyG = -bras * Math.sin(rad);
  const dyD = bras * Math.sin(rad);
  const dx = bras * (1 - Math.cos(rad));
  const etat = equilibre ? 'ok' : debit + credit > 0 ? 'ecart' : 'vide';

  // Séquence de validation : quand l'écriture devient équilibrée, la carte qui
  // contient la balance s'illumine brièvement et les montants pulsent une fois.
  const reduit = useReducedMotion();
  const racine = useRef(null);
  const etaitEquilibre = useRef(equilibre);
  const pulsation = useAnimationControls();
  useEffect(() => {
    if (equilibre && !etaitEquilibre.current && !reduit) {
      pulsation.start({ scale: [1, 1.08, 1], transition: { duration: 0.6, ease: EASE_EXPO, delay: 0.15 } });
      const carte = racine.current?.closest('.ac-apercu, .pied-saisie, .document, .ecriture-animee');
      if (carte) {
        carte.classList.remove('flash-equilibre');
        void carte.offsetWidth; // relance l'animation CSS
        carte.classList.add('flash-equilibre');
      }
    }
    etaitEquilibre.current = equilibre;
  }, [equilibre, reduit, pulsation]);

  return (
    <figure ref={racine} className={`balance balance-${etat} ${compacte ? 'balance-compacte' : ''} ${inverse ? 'balance-inverse' : ''}`}
      aria-label={equilibre ? 'Écriture équilibrée' : 'Écriture non équilibrée'}>
      <svg viewBox="0 0 220 150" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#221D16" />
            <stop offset="1" stopColor="#221D16" />
          </linearGradient>
          <linearGradient id={`${id}-colonne`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#221D16" />
            <stop offset="0.5" stopColor="#221D16" stopOpacity="0.72" />
            <stop offset="1" stopColor="#221D16" />
          </linearGradient>
          <radialGradient id={`${id}-coupe`} cx="0.5" cy="0.2" r="0.9">
            <stop offset="0" className="coupe-clair" />
            <stop offset="1" className="coupe-fonce" />
          </radialGradient>
          <filter id={`${id}-ombre`} x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="2" dy="2" stdDeviation="0" floodColor="#221D16" floodOpacity="0.9" />
          </filter>
        </defs>

        {/* ombre au sol */}
        <ellipse cx="110" cy="141" rx="46" ry="5" className="balance-sol" />
        {/* socle et colonne */}
        <path d="M84 138 Q110 126 136 138 Z" fill={`url(#${id}-metal)`} />
        <motion.rect x="106" y="40" width="8" height="94" rx="4" fill={`url(#${id}-colonne)`}
          initial={reduit ? false : { scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }}
          style={{ originY: 1, transformBox: 'fill-box' }} transition={{ duration: 0.9, ease: EASE_EXPO }} />
        {/* fléau */}
        <g className="balance-fleau" style={{ transform: `rotate(${angle}deg)` }} filter={`url(#${id}-ombre)`}>
          <rect x="34" y="35" width="152" height="7" rx="3.5" fill={`url(#${id}-metal)`} />
          <circle cx="36" cy="38.5" r="4.5" fill={`url(#${id}-metal)`} />
          <circle cx="184" cy="38.5" r="4.5" fill={`url(#${id}-metal)`} />
        </g>
        {/* pivot */}
        <circle cx="110" cy="38.5" r="9" className="balance-pivot-anneau" />
        <circle cx="110" cy="38.5" r="4.5" className="balance-pivot" />
        {/* plateaux */}
        {[{ x: 36, dx, dy: dyG }, { x: 184, dx: -dx, dy: dyD }].map((p) => (
          <g key={p.x} className="balance-plateau" style={{ transform: `translate(${p.dx}px, ${p.dy}px)` }}>
            <motion.path d={`M${p.x} 41 L${p.x - 20} 86 M${p.x} 41 L${p.x + 20} 86`} className="balance-chaine"
              initial={reduit ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
              transition={{ duration: 1.1, ease: EASE_EXPO, delay: 0.35 }} />
            <path d={`M${p.x - 27} 86 h54 q-4 16 -27 16 q-23 0 -27 -16z`} fill={`url(#${id}-coupe)`} className="balance-coupe" filter={`url(#${id}-ombre)`} />
            <ellipse cx={p.x} cy="86" rx="27" ry="3.2" className="balance-coupe-bord" />
          </g>
        ))}
      </svg>
      <figcaption>
        <span><small>Débit</small>
          <motion.b className="chiffres" animate={pulsation}>
            <Compteur valeur={debit} formater={montant} duree={0.9} />
          </motion.b>
        </span>
        <span className="balance-etat">
          <svg viewBox="0 0 24 24" className="balance-etat-icone" aria-hidden="true">
            <motion.path d={equilibre ? TRACE_COCHE : TRACE_ATTENTE} initial={false}
              animate={{ d: equilibre ? TRACE_COCHE : TRACE_ATTENTE }} transition={{ duration: 0.5, ease: EASE_EXPO }} />
          </svg>
          {equilibre ? 'Équilibrée' : etat === 'vide' ? 'En attente' : `Écart ${montant(Math.abs(debit - credit))}`}
        </span>
        <span><small>Crédit</small>
          <motion.b className="chiffres" animate={pulsation}>
            <Compteur valeur={credit} formater={montant} duree={0.9} />
          </motion.b>
        </span>
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
      <Balance debit={debit} credit={credit} inverse={inverse} />
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
