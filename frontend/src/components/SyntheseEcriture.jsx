import { useEffect, useState } from 'react';
import { montant } from '../utils/format';

const LIGNES_DEMO = [
  { compte: '6136', libelle: 'Honoraires', centre: 'ADM', debit: 30000 },
  { compte: '34552', libelle: 'TVA récupérable', debit: 6000 },
  { compte: '4411', libelle: 'Fournisseurs', credit: 36000 },
];

export default function SyntheseEcriture({ debit = 0, credit = 0, compacte = false }) {
  const equilibree = debit > 0 && Math.abs(debit - credit) < 0.005;

  return (
    <section className={`synthese-ecriture ${compacte ? 'synthese-compacte' : ''}`}
      aria-label="Totaux de l’écriture comptable">
      <div className="synthese-entete">
        <span>Totaux de l’écriture</span>
        <span className={`synthese-etat ${equilibree ? 'synthese-equilibree' : ''}`} role="status">
          {equilibree ? 'Équilibrée' : debit + credit === 0 ? 'En attente' : `Écart ${montant(Math.abs(debit - credit))}`}
        </span>
      </div>
      <div className="synthese-montants">
        <div><small>Débit</small><strong className="chiffres">{montant(debit)} MAD</strong></div>
        <div><small>Crédit</small><strong className="chiffres">{montant(credit)} MAD</strong></div>
      </div>
    </section>
  );
}

export function EcritureAnimee() {
  const reduit = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [visibles, setVisibles] = useState(reduit ? LIGNES_DEMO.length : 0);

  useEffect(() => {
    if (visibles >= LIGNES_DEMO.length) return undefined;
    const minuterie = setTimeout(() => setVisibles((v) => v + 1), visibles === 0 ? 500 : 900);
    return () => clearTimeout(minuterie);
  }, [visibles]);

  return (
    <div className="ecriture-animee">
      <ol className="ecriture-lignes">
        {LIGNES_DEMO.map((ligne, index) => (
          <li key={ligne.compte} className={index < visibles ? 'visible' : ''}>
            <span className="ecriture-compte"><b>{ligne.compte}</b> {ligne.libelle}</span>
            {ligne.centre ? <span className="code-centre">{ligne.centre}</span> : <span />}
            <span className="chiffres">{ligne.debit ? montant(ligne.debit) : ''}</span>
            <span className="chiffres">{ligne.credit ? montant(ligne.credit) : ''}</span>
          </li>
        ))}
      </ol>
      <p className="ecriture-legende">Exemple d’écriture · Comptabilité générale</p>
    </div>
  );
}
