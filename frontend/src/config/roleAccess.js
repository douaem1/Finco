/**
 * SOURCE DE VÉRITÉ UNIQUE POUR LES ACCÈS PAR RÔLE (RBAC).
 *
 * Découpage conforme au diagramme de cas d'utilisation FinCo :
 * - COMPTABLE : Saisie d'écriture, Journal, Tiers (clients/fournisseurs), Exercices
 *               (+ TODO futures pages : factures, paiements, grand livre).
 * - CONTROLEUR : Centres de coûts, Budgets CO
 *               (+ TODO futures pages : répartition des coûts, rapports analytiques).
 * - ADMIN : Plan comptable
 *               (+ TODO future page : gestion des utilisateurs).
 * - DIRECTEUR_FINANCIER : Espace direction
 *               (+ TODO futures pages : validation des paiements, tableau de bord).
 */

export const ROLES = {
  COMPTABLE: 'COMPTABLE',
  CONTROLEUR: 'CONTROLEUR',
  DIRECTEUR_FINANCIER: 'DIRECTEUR_FINANCIER',
  ADMIN: 'ADMIN',
};

/**
 * Configuration de chaque page de l'application.
 *
 * - path : chemin exact ou motif de route
 * - pattern : regex de correspondance pour les URLs dynamiques (ex: /pieces/:id)
 * - libelle : texte affiché dans la barre latérale
 * - icone : nom de l'icône SVG dans Icone.jsx
 * - section : groupe visuel dans la barre latérale
 * - roles : tableau des rôles autorisés à afficher et visiter la page
 * - dansMenu : true si la page apparaît dans la barre latérale, false si sous-page ou page technique
 * - end : correspondance exacte du lien de navigation actif
 */
export const PAGES = [
  // ==========================================
  // MODULE COMPTABILITÉ FINANCIÈRE (COMPTABLE)
  // ==========================================
  {
    path: '/pieces',
    libelle: 'Journal',
    icone: 'journal',
    section: 'Comptabilité financière',
    roles: [ROLES.COMPTABLE],
    dansMenu: true,
    end: true,
  },
  {
    path: '/pieces/nouvelle',
    libelle: "Saisie d'écriture",
    icone: 'plus',
    section: 'Comptabilité financière',
    roles: [ROLES.COMPTABLE],
    dansMenu: true,
    end: false,
  },
  {
    path: '/pieces/:id',
    pattern: /^\/pieces\/\d+$/,
    libelle: "Détail de pièce",
    icone: 'journal',
    section: 'Comptabilité financière',
    roles: [ROLES.COMPTABLE],
    dansMenu: false,
  },
  {
    path: '/tiers',
    libelle: 'Tiers',
    icone: 'tiers',
    section: 'Comptabilité financière',
    roles: [ROLES.COMPTABLE],
    dansMenu: true,
    end: false,
  },
  {
    path: '/exercices',
    libelle: 'Exercices',
    icone: 'calendrier',
    section: 'Comptabilité financière',
    roles: [ROLES.COMPTABLE],
    dansMenu: true,
    end: false,
  },
  // TODO [COMPTABLE] : /factures -> Gérer les factures
  // TODO [COMPTABLE] : /paiements -> Enregistrer un paiement
  // TODO [COMPTABLE] : /grand-livre -> Consulter le grand livre et la balance

  // ==========================================
  // MODULE CONTRÔLE DE GESTION (CONTROLEUR)
  // ==========================================
  {
    path: '/centres-cout',
    libelle: 'Centres de coûts',
    icone: 'centres',
    section: 'Contrôle de gestion',
    roles: [ROLES.CONTROLEUR],
    dansMenu: true,
    end: false,
  },
  {
    path: '/budgets',
    libelle: 'Budgets CO',
    icone: 'balance',
    section: 'Contrôle de gestion',
    roles: [ROLES.CONTROLEUR],
    dansMenu: true,
    end: false,
  },
  // TODO [CONTROLEUR] : /repartition-couts -> Répartir les coûts
  // TODO [CONTROLEUR] : /rapports-analytiques -> Consulter les rapports analytiques

  // ==========================================
  // MODULE ADMINISTRATION (ADMIN)
  // ==========================================
  {
    path: '/comptes',
    libelle: 'Plan comptable',
    icone: 'comptes',
    section: 'Administration',
    roles: [ROLES.ADMIN],
    dansMenu: true,
    end: false,
  },
  // TODO [ADMIN] : /utilisateurs -> Gérer les utilisateurs

  // ==========================================
  // MODULE DIRECTION FINANCIÈRE (DIRECTEUR_FINANCIER)
  // ==========================================
  {
    path: '/direction',
    libelle: 'Espace Direction',
    icone: 'balance',
    section: 'Direction financière',
    roles: [ROLES.DIRECTEUR_FINANCIER],
    dansMenu: true,
    end: false,
  },
  // TODO [DIRECTEUR_FINANCIER] : /validation-paiements -> Valider les paiements
  // TODO [DIRECTEUR_FINANCIER] : /tableau-de-bord -> Consulter le tableau de bord
];

/**
 * Page d'accueil par défaut de chaque rôle (utilisée après login et lors de redirections).
 */
export const PAGE_ACCUEIL_PAR_ROLE = {
  [ROLES.COMPTABLE]: '/pieces',
  [ROLES.CONTROLEUR]: '/centres-cout',
  [ROLES.ADMIN]: '/comptes',
  [ROLES.DIRECTEUR_FINANCIER]: '/direction',
};

/**
 * Renvoie la page d'accueil par défaut pour un rôle donné.
 */
export function pageAccueilPourRole(role) {
  return PAGE_ACCUEIL_PAR_ROLE[role] || '/login';
}

/**
 * Vérifie si un chemin donné est autorisé pour le rôle spécifié.
 */
export function estRouteAutorisee(pathname, role) {
  if (!role) return false;

  // Recherche dans les pages configurées
  const page = PAGES.find((p) => {
    if (p.pattern) {
      return p.pattern.test(pathname);
    }
    return p.path === pathname;
  });

  if (!page) {
    return false; // Route inconnue ou non répertoriée
  }

  return page.roles.includes(role);
}

/**
 * Retourne les groupes de navigation visibles pour le rôle connecté.
 * Une section sans aucune entrée autorisée est exclue.
 */
export function obtenirSectionsMenuPourRole(role) {
  if (!role) return [];

  const pagesVisibles = PAGES.filter((p) => p.dansMenu && p.roles.includes(role));

  // Regroupement ordonné par section
  const sectionsMap = new Map();
  for (const page of pagesVisibles) {
    if (!sectionsMap.has(page.section)) {
      sectionsMap.set(page.section, []);
    }
    sectionsMap.get(page.section).push(page);
  }

  return Array.from(sectionsMap.entries()).map(([nom, items]) => ({
    nom,
    items,
  }));
}
