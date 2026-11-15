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
  tiers: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>,
  utilisateurs: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0" /><path d="M16 11a3 3 0 100-6M17 14.5a5.5 5.5 0 014.5 5.5" /></>,
  editer: <><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></>,
  supprimer: <><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></>,
  croix: <><path d="M18 6L6 18M6 6l12 12" /></>,
  sortie: <><path d="M10 4.5H6.5a2 2 0 00-2 2v11a2 2 0 002 2H10" /><path d="M15 16l4-4-4-4M19 12H9.5" /></>,
  recherche: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.3-4.3" /></>,
  valide: <><circle cx="12" cy="12" r="8.5" /><path d="M8.2 12.3l2.5 2.5 5-5.3" /></>,
  balance: <><path d="M12 4v15M7 19.5h10M5 8h14" /><path d="M7.5 8l-3 6h6zM16.5 8l-3 6h6z" /></>,
  fleche: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  verrou: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>,
  calendrier: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  factures: <><path d="M6 3.5h9l4 4v13H6z" /><path d="M15 3.5v4h4M9 12h7M9 16h7" /></>,
  paiements: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  grandLivre: <><path d="M4 5.5A2.5 2.5 0 016.5 3H20v17H6.5A2.5 2.5 0 014 17.5z" /><path d="M4 6v12M8 7h8M8 11h8M8 15h5" /></>,
  repartition: <><path d="M4 7h8M12 7l-3-3M12 7l-3 3M20 17h-8M12 17l3-3M12 17l3 3" /><circle cx="4" cy="7" r="1.5" /><circle cx="20" cy="17" r="1.5" /></>,
  rapport: <><path d="M4 20V4M4 20h17" /><path d="M8 16v-4M13 16V8M18 16V5" /></>,
  soleil: <><circle cx="12" cy="12" r="4.2" /><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.7 5.7l1.6 1.6M16.7 16.7l1.6 1.6M18.3 5.7l-1.6 1.6M7.3 16.7l-1.6 1.6" /></>,
  lune: <><path d="M20.5 14.8A8.6 8.6 0 019.2 3.5a8.6 8.6 0 1011.3 11.3z" /></>,
  ecran: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M9 21h6M12 17v4" /></>,
  coche: <><path d="M5 12.5l4.5 4.5L19 7" /></>,
};

export default function Icone({ nom, taille = 20, className = '' }) {
  return (
    <svg className={`icone ${className}`} width={taille} height={taille} viewBox="0 0 24 24" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {TRACES[nom]}
    </svg>
  );
}
