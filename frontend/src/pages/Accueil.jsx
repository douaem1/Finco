import { useEffect, useState } from 'react';
import './accueil.css';

/* ============================================================
   Page d'accueil publique de FinCo — thème clair « papier & encre »
   (seule page codée du squelette — le reste est à compléter)
   ============================================================ */

const TICKER = ['Débit = Crédit', 'Plan comptable CGNC', 'FI · Comptabilité financière', 'CO · Contrôle de gestion',
  'Budgets & écarts', 'Répartition des coûts', 'Factures → Écritures', 'Montants en MAD'];

const MODULES = [
  {
    lettre: 'FI',
    couleur: 'corail',
    titre: 'Comptabilité financière',
    texte: "Saisie des écritures en partie double, plan comptable CGNC, factures fournisseurs et clients, paiements, grand livre et balance.",
    points: ['Écritures équilibrées (Débit = Crédit)', 'Cycle facture : brouillon → validée → payée', 'Balance et états financiers'],
  },
  {
    lettre: 'CO',
    couleur: 'sarcelle',
    titre: 'Contrôle de gestion',
    texte: "Centres de coûts, budgets annuels, répartition des charges des centres auxiliaires vers les principaux, analyse des écarts.",
    points: ['Imputation analytique des charges', 'part = montant × clé / Σ clés', 'Suivi réel / budget et écarts'],
  },
];

const FONCTIONNALITES = [
  { icone: '⚖️', couleur: 'jaune', titre: 'Partie double garantie', texte: 'Aucune écriture ne passe si Σ débits ≠ Σ crédits.' },
  { icone: '🧾', couleur: 'corail', titre: 'Factures automatisées', texte: 'Valider une facture génère son écriture comptable.' },
  { icone: '🏭', couleur: 'sarcelle', titre: 'Centres de coûts', texte: 'Chaque charge de classe 6 est imputée sur un centre.' },
  { icone: '📊', couleur: 'lilas', titre: 'Tableau de bord', texte: 'CA, charges et résultat en direct pour le DAF.' },
  { icone: '🔐', couleur: 'jaune', titre: '4 rôles métier', texte: 'Comptable, contrôleur, directeur financier, admin.' },
  { icone: '🇲🇦', couleur: 'corail', titre: 'Contexte marocain', texte: 'CGNC, MAD et TVA 20 / 14 / 10 / 7 %.' },
];

const ETAPES = [
  { n: '1', titre: 'Saisir', texte: 'Le comptable enregistre factures et écritures.' },
  { n: '2', titre: 'Contrôler', texte: 'Le contrôleur suit budgets et écarts.' },
  { n: '3', titre: 'Valider', texte: 'Le directeur financier approuve les paiements.' },
  { n: '4', titre: 'Clôturer', texte: 'Répartition des coûts et états financiers.' },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function Accueil() {
  const [etatApi, setEtatApi] = useState('verification');

  useEffect(() => {
    let actif = true;

    fetch(`${API_URL}/api/test`)
      .then((reponse) => {
        if (!reponse.ok) throw new Error('API indisponible');
        return reponse.text();
      })
      .then(() => actif && setEtatApi('operationnel'))
      .catch(() => actif && setEtatApi('indisponible'));

    return () => { actif = false; };
  }, []);

  return (
    <div className="accueil">
      {/* formes décoratives */}
      <span className="forme cercle" aria-hidden="true" />
      <span className="forme demi" aria-hidden="true" />
      <span className="forme croix" aria-hidden="true">+</span>
      <span className="forme croix c2" aria-hidden="true">+</span>

      {/* ---------- barre de navigation ---------- */}
      <header className="nav">
        <div className="nav-logo">
          <span className="tampon">F</span>
          <span>Fin<b>Co</b></span>
        </div>
        <nav className="nav-liens">
          <a href="#modules">Modules</a>
          <a href="#fonctionnalites">Fonctionnalités</a>
          <a href="#flux">Comment ça marche</a>
        </nav>
      
      </header>

      {/* ---------- héros ---------- */}
      <main className="heros">
        <div className="heros-texte">
          <span className="badge">✦ Inspiré de SAP FI / CO</span>
          <h1>
            La compta,<br />
            <span className="surligne">enfin</span> en{' '}
            <span className="entoure">équilibre<svg viewBox="0 0 220 70" preserveAspectRatio="none"><ellipse cx="110" cy="35" rx="105" ry="30" /></svg></span>
          </h1>
          <p className="sous-titre">
            FinCo réunit la <strong>comptabilité financière</strong> et le{' '}
            <strong>contrôle de gestion</strong> : écritures en partie double,
            factures, budgets, répartition des coûts et tableaux de bord —
            du brouillon à la clôture.
          </p>
        </div>

        {/* collage : pièce comptable + graphique + autocollants */}
        <div className="heros-visuel">
          <div className="papier piece">
            <div className="piece-entete">
              <span className="perfo" /><span className="perfo" /><span className="perfo" />
              <b>Pièce n° PC-2026-001</b>
              <span className="tampon-valide">VALIDÉE ✓</span>
            </div>
            <table>
              <thead>
                <tr><th>Compte</th><th>Débit</th><th>Crédit</th></tr>
              </thead>
              <tbody>
                <tr><td>6131 · Loyer</td><td>90 000</td><td>—</td></tr>
                <tr><td>34552 · TVA</td><td>18 000</td><td>—</td></tr>
                <tr><td>4411 · Frs</td><td>—</td><td>108 000</td></tr>
              </tbody>
              <tfoot>
                <tr><td>Totaux</td><td>108 000</td><td>108 000</td></tr>
              </tfoot>
            </table>
          </div>

          <div className="papier graphe">
            <b>Réel / budget par centre</b>
            <div className="barres">
              {[
                { h: 62, c: 'corail' }, { h: 88, c: 'sarcelle' }, { h: 48, c: 'jaune' },
                { h: 95, c: 'lilas' }, { h: 70, c: 'corail' }, { h: 56, c: 'sarcelle' },
              ].map((b, i) => (
                <span key={i} className={b.c} style={{ '--h': `${b.h}%`, '--d': `${i * 0.1}s` }} />
              ))}
            </div>
          </div>

          <span className="autocollant a1">⚖️ Débit = Crédit</span>
          <span className="autocollant a2">100 % équilibré</span>
          <span className="autocollant a3">MAD</span>
        </div>
      </main>

      {/* ---------- ruban défilant ---------- */}
      <div className="ruban" aria-hidden="true">
        <div className="ruban-piste">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i}>{t} <i>✦</i></span>
          ))}
        </div>
      </div>

      {/* ---------- modules FI / CO ---------- */}
      <section id="modules" className="section">
        <h2><span className="surligne-fin">Deux modules</span>, une seule vérité comptable</h2>
        <p className="section-intro">Comme dans SAP, la finance (FI) et le contrôle de gestion (CO) partagent les mêmes écritures.</p>
        <div className="modules">
          {MODULES.map((m) => (
            <article key={m.lettre} className={`module fond-${m.couleur}`}>
              <span className="module-lettre">{m.lettre}</span>
              <h3>{m.titre}</h3>
              <p>{m.texte}</p>
              <ul>
                {m.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- fonctionnalités ---------- */}
      <section id="fonctionnalites" className="section">
        <h2>Pensé pour <span className="surligne-fin">chaque rôle</span></h2>
        <div className="fonctionnalites">
          {FONCTIONNALITES.map((f, i) => (
            <article key={f.titre} className={`fonc pente-${i % 3}`}>
              <span className={`fonc-icone fond-${f.couleur}`}>{f.icone}</span>
              <h4>{f.titre}</h4>
              <p>{f.texte}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- flux de travail ---------- */}
      <section id="flux" className="section">
        <h2>Du brouillon <span className="surligne-fin">à la clôture</span></h2>
        <div className="etapes">
          {ETAPES.map((e) => (
            <div key={e.n} className="etape">
              <span className="etape-num">{e.n}</span>
              <h4>{e.titre}</h4>
              <p>{e.texte}</p>
            </div>
          ))}
        </div>
      </section>

    

      <footer className="pied">
        <span><span className="tampon petit">F</span> FinCo — Comptabilité financière &amp; contrôle de gestion</span>
        <span className="muet">Projet académique inspiré de SAP FI/CO · Spring Boot · React · MySQL</span>
      </footer>
    </div>
  );
}
