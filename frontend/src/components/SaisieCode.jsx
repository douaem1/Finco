import { useRef } from 'react';

/**
 * Saisie d'un code à 6 chiffres en 6 cases.
 * Ergonomie uniquement : passage automatique à la case suivante,
 * retour arrière, collage du code complet. La vérification se fait côté serveur.
 */
export default function SaisieCode({ valeur, onChange, longueur = 6, desactive = false, enErreur = false }) {
  const cases = useRef([]);
  const chiffres = Array.from({ length: longueur }, (_, i) => valeur[i] ?? '');

  function ecrire(index, texte) {
    const nettoye = texte.replace(/\D/g, '');
    if (!nettoye) return;
    const suite = (valeur.slice(0, index) + nettoye).slice(0, longueur);
    onChange(suite);
    cases.current[Math.min(suite.length, longueur - 1)]?.focus();
  }

  function touche(index, e) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const cible = valeur[index] ? index : index - 1;
      if (cible < 0) return;
      onChange(valeur.slice(0, cible));
      cases.current[cible]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      cases.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < longueur - 1) {
      cases.current[index + 1]?.focus();
    }
  }

  return (
    <div className={`code-cases ${enErreur ? 'code-erreur' : ''}`} role="group" aria-label="Code de vérification">
      {chiffres.map((c, i) => (
        <input
          key={i}
          ref={(el) => { cases.current[i] = el; }}
          className="code-case"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={longueur}
          value={c}
          disabled={desactive}
          autoFocus={i === 0}
          aria-label={`Chiffre ${i + 1}`}
          onChange={(e) => ecrire(i, e.target.value)}
          onKeyDown={(e) => touche(i, e)}
          onFocus={(e) => e.target.select()}
          onPaste={(e) => { e.preventDefault(); ecrire(0, e.clipboardData.getData('text')); }}
        />
      ))}
    </div>
  );
}
