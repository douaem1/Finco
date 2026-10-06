import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../services/api';
import Logo from '../components/Logo';
import { EcritureAnimee } from '../components/Balance';
import './accueil.css';

/* ============================================================
   Page d'accueil publique de FinCo.
   ============================================================ */

const MODULES = [
  {
    code: 'FI',
    titre: 'Comptabilité financière',
    texte: 'Écritures en partie double sur le plan comptable CGNC, factures fournisseurs et clients, paiements, grand livre et balance.',
    points: ['Pièces numérotées par exercice', 'Contrôle débit = crédit à chaque saisie', 'Cycle facture : brouillon, validée, payée'],
  },
  {
    code: 'CO',
    titre: 'Contrôle de gestion',
    texte: 'Centres de coûts principaux et auxiliaires, budgets annuels, répartition des charges et analyse des écarts.',
    points: ['Imputation de chaque charge de classe 6', 'Répartition selon des clés (surface, effectif…)', 'Suivi réel / budget par centre'],
  },
];

const FONCTIONNALITES = [
  { icone: 'balance', titre: 'Partie double contrôlée', texte: 'Une pièce n’est enregistrée que si le total des débits égale le total des crédits.' },
  { icone: 'centre', titre: 'Charges imputées', texte: 'Toute charge de classe 6 est rattachée à un centre de coûts dès la saisie.' },
  { icone: 'cadenas', titre: 'Connexion en deux étapes', texte: 'Mot de passe puis code à usage unique reçu par email.' },
  { icone: 'roles', titre: 'Quatre rôles métier', texte: 'Comptable, contrôleur de gestion, directeur financier et administrateur.' },
  { icone: 'facture', titre: 'Factures et paiements', texte: 'La validation d’une facture produit son écriture comptable.' },
  { icone: 'maroc', titre: 'Cadre marocain', texte: 'Plan comptable CGNC, montants en dirhams, TVA à 20, 14, 10 et 7 %.' },
];

const ETAPES = [
  { titre: 'Saisir', texte: 'Le comptable enregistre les pièces et les factures.' },
  { titre: 'Contrôler', texte: 'Le contrôleur de gestion suit les budgets et les écarts.' },
  { titre: 'Valider', texte: 'Le directeur financier approuve les paiements.' },
  { titre: 'Clôturer', texte: 'Les coûts sont répartis et les états financiers produits.' },
];

function Icone({ nom }) {
  const traits = {
    balance: <><path d="M12 4v16M6 20h12M4 8h16" /><path d="M7 8l-3 6h6zM17 8l-3 6h6z" /></>,
    centre: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
    cadenas: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 018 0v3M12 14.5v2.5" /></>,
    roles: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0111 0" /><circle cx="17" cy="9" r="2.4" /><path d="M15.5 14.2a4.5 4.5 0 015.5 4.8" /></>,
    facture: <><path d="M6 3h9l3 3v15l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21z" /><path d="M9 9h6M9 13h6M9 17h3" /></>,
    maroc: <><path d="M12 3.5l2.3 6.8h7.1l-5.8 4.2 2.2 6.9L12 17.2l-5.8 4.2 2.2-6.9-5.8-4.2h7.1z" /></>,
  };
  return (
    <svg className="ac-icone" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {traits[nom]}
    </svg>
  );
}

export default function Accueil() {
  const { estConnecte } = useAuth();
  const [etatApi, setEtatApi] = useState('verification');

  useEffect(() => {
    let actif = true;
    fetch(`${API_URL}/api/test`)
      .then((reponse) => { if (!reponse.ok) throw new Error(); })
      .then(() => actif && setEtatApi('operationnel'))
      .catch(() => actif && setEtatApi('indisponible'));
    return () => { actif = false; };
  }, []);

  const lienEspace = estConnecte ? '/pieces' : '/login';
  const texteEspace = estConnecte ? 'Ouvrir mon espace' : 'Se connecter';

  return (
    <div className="ac">
      <header className="ac-nav">
        <Link to="/" className="ac-nav-logo"><Logo /></Link>
        <nav className="ac-nav-liens" aria-label="Sections de la page">
          <a href="#modules">Modules</a>
          <a href="#fonctionnalites">Fonctionnalités</a>
          <a href="#fonctionnement">Fonctionnement</a>
        </nav>
        <Link to={lienEspace} className="btn btn-primaire">{texteEspace}</Link>
      </header>

      <main>
        <section className="ac-heros">
          <div className="ac-heros-texte">
            <h1>La comptabilité et le contrôle de gestion de votre PME, dans un seul registre.</h1>
            <p>
              FinCo enregistre vos écritures en partie double selon le plan comptable CGNC,
              impute chaque charge sur un centre de coûts et suit vos budgets au fil de l’exercice.
            </p>
            <div className="ac-heros-actions">
              <Link to={lienEspace} className="btn btn-primaire btn-heros">{texteEspace}</Link>
              <a href="#modules" className="btn btn-secondaire btn-heros">Découvrir les modules</a>
            </div>
          </div>

          <div className="ac-apercu" aria-label="Démonstration : une écriture en partie double s’équilibre">
            <div className="ac-apercu-barre">
              <span>Pièce PC-2026-00017</span>
              <span className="texte-secondaire">Facture Cabinet Audit F-0917</span>
            </div>
            <EcritureAnimee />
          </div>
        </section>

        <section id="modules" className="ac-section">
          <div className="ac-section-tete">
            <h2>Deux modules, les mêmes écritures</h2>
            <p>Comme dans SAP, la finance et le contrôle de gestion partagent une seule source de vérité.</p>
          </div>
          <div className="ac-modules">
            {MODULES.map((m) => (
              <article key={m.code} className="ac-module">
                <span className="ac-module-code">{m.code}</span>
                <h3>{m.titre}</h3>
                <p>{m.texte}</p>
                <ul>{m.points.map((p) => <li key={p}>{p}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>

        <section id="fonctionnalites" className="ac-section ac-section-blanche">
          <div className="ac-section-tete">
            <h2>Ce que FinCo vérifie pour vous</h2>
            <p>Les règles comptables sont appliquées par le serveur, à chaque enregistrement.</p>
          </div>
          <div className="ac-fonctions">
            {FONCTIONNALITES.map((f) => (
              <article key={f.titre} className="ac-fonction">
                <Icone nom={f.icone} />
                <h3>{f.titre}</h3>
                <p>{f.texte}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="fonctionnement" className="ac-section">
          <div className="ac-section-tete">
            <h2>Du brouillon à la clôture</h2>
            <p>Chaque rôle intervient à son étape du cycle comptable.</p>
          </div>
          <ol className="ac-etapes">
            {ETAPES.map((e) => (
              <li key={e.titre}>
                <h3>{e.titre}</h3>
                <p>{e.texte}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="ac-pied">
        <Logo avecSlogan={false} taille={28} />
        <p>Projet académique inspiré de SAP FI/CO — Spring Boot, React et MySQL.</p>
        <p className={`ac-api ac-api-${etatApi}`}>
          {etatApi === 'operationnel' ? 'Serveur disponible' : etatApi === 'indisponible' ? 'Serveur indisponible' : 'Vérification du serveur…'}
        </p>
      </footer>
    </div>
  );
}
