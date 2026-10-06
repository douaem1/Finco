/** Petites icônes au trait (SVG), héritent de la couleur du texte. */
const TRACES = {
  accueil: <><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></>,
  tendance: <><path d="M4 16l5-5 4 4 7-7" /><path d="M15 8h5v5" /></>,
  horloge: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  pieces: <><path d="M7 3.5h7l4 4v13H7z" /><path d="M14 3.5v4h4M10 12h5M10 16h5" /></>,
  journal: <><path d="M5 4.5h11a3 3 0 013 3v12H8a3 3 0 01-3-3z" /><path d="M5 16.5a3 3 0 013-3h11M9 8.5h6" /></>,
  plus: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v8M8 12h8" /></>,
  centres: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></>,
  comptes: <><path d="M4 6h16M4 12h16M4 18h10" /><circle cx="18.5" cy="18" r="1.5" /></>,
  sortie: <><path d="M10 4.5H6.5a2 2 0 00-2 2v11a2 2 0 002 2H10" /><path d="M15 16l4-4-4-4M19 12H9.5" /></>,
  recherche: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.3-4.3" /></>,
  valide: <><circle cx="12" cy="12" r="8.5" /><path d="M8.2 12.3l2.5 2.5 5-5.3" /></>,
  balance: <><path d="M12 4v15M7 19.5h10M5 8h14" /><path d="M7.5 8l-3 6h6zM16.5 8l-3 6h6z" /></>,
  fleche: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
};

export default function Icone({ nom, taille = 20, className = '' }) {
  return (
    <svg className={`icone ${className}`} width={taille} height={taille} viewBox="0 0 24 24" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {TRACES[nom]}
    </svg>
  );
}
