import { useTheme } from '../context/ThemeContext';
import Icone from './Icone';
import Tooltip from './ui/Tooltip';

/**
 * Bouton fantôme 40 px qui bascule entre le mode clair et le mode sombre.
 * Utilise `useTheme()` : le thème résolu détermine l'icône affichée.
 */
export default function ThemeToggle({ className = '' }) {
  const { resolved, setMode } = useTheme();
  const sombre = resolved === 'sombre';
  const libelle = sombre ? 'Passer en mode clair' : 'Passer en mode sombre';

  return (
    <Tooltip label={libelle}>
      <button
        type="button"
        className={`theme-toggle ${className}`.trim()}
        aria-label={libelle}
        aria-pressed={sombre}
        onClick={() => setMode(sombre ? 'clair' : 'sombre')}
      >
        <Icone nom={sombre ? 'soleil' : 'lune'} taille={20} />
      </button>
    </Tooltip>
  );
}
