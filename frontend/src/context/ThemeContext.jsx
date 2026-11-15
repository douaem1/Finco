import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Gestion du thème (clair / sombre / système), indépendante de l'authentification.
 * - `mode`      : préférence choisie par l'utilisateur (« clair » | « sombre » | « systeme »)
 * - `resolved`  : thème réellement appliqué (« clair » | « sombre »)
 * - `setMode`   : change la préférence (persistée dans localStorage)
 * Applique `data-theme` sur <html> et met à jour <meta name="theme-color">.
 */

const CLE_THEME = 'finco-theme';
const MODES = ['clair', 'sombre', 'systeme'];

const ThemeContext = createContext(null);

function systemePrefereSombre() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function lireMode() {
  try {
    const valeur = localStorage.getItem(CLE_THEME);
    if (MODES.includes(valeur)) return valeur;
  } catch {
    /* stockage indisponible : on retombe sur le mode système */
  }
  return 'systeme';
}

export function ThemeProvider({ children }) {
  const [mode, setModeEtat] = useState(lireMode);
  const [prefereSombre, setPrefereSombre] = useState(systemePrefereSombre);

  const setMode = useCallback((nouveau) => {
    if (!MODES.includes(nouveau)) return;
    setModeEtat(nouveau);
    try {
      localStorage.setItem(CLE_THEME, nouveau);
    } catch {
      /* ignore */
    }
  }, []);

  // Suit en direct le réglage du système (utile en mode « systeme »).
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const surChangement = (evenement) => setPrefereSombre(evenement.matches);
    media.addEventListener('change', surChangement);
    return () => media.removeEventListener('change', surChangement);
  }, []);

  const resolved = mode === 'systeme' ? (prefereSombre ? 'sombre' : 'clair') : mode;

  // Applique le thème résolu AVANT le rendu des enfants : les graphiques
  // ECharts lisent les variables CSS au moment du rendu et doivent voir
  // la nouvelle valeur immédiatement (pas de décalage d'un rendu).
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolved === 'sombre' ? 'dark' : 'light');
  }

  // Complète l'application du thème (color-scheme + couleur de la barre du navigateur).
  useEffect(() => {
    const racine = document.documentElement;
    const sombre = resolved === 'sombre';
    racine.setAttribute('data-theme', sombre ? 'dark' : 'light');
    racine.style.colorScheme = sombre ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', sombre ? '#17140F' : '#FBF6EC');
  }, [resolved]);

  // Active les transitions seulement après le premier rendu (aucun flash au chargement).
  useEffect(() => {
    const racine = document.documentElement;
    const image = requestAnimationFrame(() => racine.classList.add('theme-transitions'));
    return () => cancelAnimationFrame(image);
  }, []);

  const valeur = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);
  return <ThemeContext.Provider value={valeur}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const contexte = useContext(ThemeContext);
  if (!contexte) {
    throw new Error('useTheme doit être utilisé à l’intérieur d’un ThemeProvider.');
  }
  return contexte;
}
