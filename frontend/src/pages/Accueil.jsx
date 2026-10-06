import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence, motion, useMotionTemplate, useMotionValue, useReducedMotion,
  useScroll, useSpring, useTransform,
} from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../services/api';
import Logo from '../components/Logo';
import { EcritureAnimee } from '../components/Balance';
import {
  CurseurPersonnalise, EASE_EXPO, Inclinable, Magnetique, SPRING_DOUX, TitreMots, TitreRevele,
  apparition, delaiNonLineaire,
} from '../components/animation/Mouvement';
import './accueil.css';

/* ============================================================
   Page d'accueil publique de FinCo.
   Couche d'animation : parallaxe 3D pilotée par le scroll,
   lumière ambiante qui suit le curseur, section « cycle »
   collante pilotée par le défilement, révélations par masque.
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

const TICKER = ['Débit = Crédit', 'Plan comptable CGNC', 'FI · Comptabilité financière', 'CO · Contrôle de gestion',
  'Budgets & écarts', 'Répartition des coûts', 'Factures → Écritures', 'Montants en MAD'];

const SECTIONS = [
  { id: 'modules', libelle: 'Modules' },
  { id: 'fonctionnalites', libelle: 'Fonctionnalités' },
  { id: 'fonctionnement', libelle: 'Fonctionnement' },
];

/* Les traits des icônes se dessinent (stroke-dashoffset via pathLength) à l'apparition. */
const TRACE = {
  initial: { pathLength: 0, opacity: 0 },
  whileInView: { pathLength: 1, opacity: 1 },
  viewport: { once: true, margin: '-40px' },
};
const P = ({ i = 0, ...props }) => <motion.path {...TRACE} transition={{ duration: 1.3, ease: EASE_EXPO, delay: 0.25 + i * 0.12 }} {...props} />;
const C = ({ i = 0, ...props }) => <motion.circle {...TRACE} transition={{ duration: 1.3, ease: EASE_EXPO, delay: 0.25 + i * 0.12 }} {...props} />;
const R = ({ i = 0, ...props }) => <motion.rect {...TRACE} transition={{ duration: 1.3, ease: EASE_EXPO, delay: 0.25 + i * 0.12 }} {...props} />;

function Icone({ nom }) {
  const traits = {
    balance: <><P d="M12 4v16M6 20h12M4 8h16" /><P i={1} d="M7 8l-3 6h6zM17 8l-3 6h6z" /></>,
    centre: <><C cx="12" cy="12" r="8" /><C i={1} cx="12" cy="12" r="3.5" /><P i={2} d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
    cadenas: <><R x="5" y="10.5" width="14" height="10" rx="2" /><P i={1} d="M8 10.5V7.5a4 4 0 018 0v3M12 14.5v2.5" /></>,
    roles: <><C cx="9" cy="8" r="3" /><P i={1} d="M3.5 19a5.5 5.5 0 0111 0" /><C i={2} cx="17" cy="9" r="2.4" /><P i={3} d="M15.5 14.2a4.5 4.5 0 015.5 4.8" /></>,
    facture: <><P d="M6 3h9l3 3v15l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21z" /><P i={1} d="M9 9h6M9 13h6M9 17h3" /></>,
    maroc: <><P d="M12 3.5l2.3 6.8h7.1l-5.8 4.2 2.2 6.9L12 17.2l-5.8 4.2 2.2-6.9-5.8-4.2h7.1z" /></>,
  };
  return (
    <svg className="ac-icone" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {traits[nom]}
    </svg>
  );
}

/* Soulignement du lien actif : une trajectoire SVG courbe qui se trace,
   et qui glisse d'un lien à l'autre (layoutId). */
function Soulignement() {
  return (
    <motion.svg layoutId="soulignement-nav" className="ac-souligne" viewBox="0 0 100 10" preserveAspectRatio="none"
      transition={{ type: 'spring', stiffness: 420, damping: 40 }} aria-hidden="true">
      <motion.path d="M2 6 C 18 1.5, 34 9, 52 5 S 86 2.5, 98 5.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: EASE_EXPO }} />
    </motion.svg>
  );
}

/* Section « cycle » : collante pendant le défilement ; chaque étape
   s'illumine à son tour selon la progression du scroll. */
function CycleComptable() {
  const reduit = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const progression = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.6 });
  const [actif, setActif] = useState(0);
  useEffect(() => progression.on('change', (v) => setActif(Math.min(ETAPES.length - 1, Math.floor(v * ETAPES.length * 0.999)))), [progression]);
  const hauteurBarre = useTransform(progression, [0, 1], ['0%', '100%']);

  if (reduit) {
    return (
      <section id="fonctionnement" className="ac-section">
        <div className="ac-section-tete">
          <h2>Du brouillon à la clôture</h2>
          <p>Chaque rôle intervient à son étape du cycle comptable.</p>
        </div>
        <ol className="ac-etapes">
          {ETAPES.map((e) => <li key={e.titre}><h3>{e.titre}</h3><p>{e.texte}</p></li>)}
        </ol>
      </section>
    );
  }

  return (
    <section id="fonctionnement" ref={ref} className="ac-cycle">
      <div className="ac-cycle-colle">
        <div className="ac-cycle-gauche">
          <div className="ac-section-tete">
            <TitreRevele>Du brouillon à la clôture</TitreRevele>
            <p>Chaque rôle intervient à son étape du cycle comptable.</p>
          </div>
          <ol className="ac-etapes ac-etapes-cycle">
            <span className="ac-cycle-rail" aria-hidden="true"><motion.span style={{ height: hauteurBarre }} /></span>
            {ETAPES.map((e, i) => (
              <motion.li key={e.titre} className={i === actif ? 'actif' : i < actif ? 'fait' : ''}
                animate={{ opacity: i === actif ? 1 : i < actif ? 0.7 : 0.38, x: i === actif ? 8 : 0 }}
                transition={SPRING_DOUX}>
                <h3>{e.titre}</h3>
                <p>{e.texte}</p>
              </motion.li>
            ))}
          </ol>
        </div>

        <div className="ac-cycle-droite" aria-hidden="true">
          <svg className="ac-cycle-anneau" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="88" className="ac-cycle-anneau-fond" />
            <motion.circle cx="100" cy="100" r="88" className="ac-cycle-anneau-trace" style={{ pathLength: progression }} />
          </svg>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={actif} className="ac-cycle-etape"
              initial={{ opacity: 0, y: 30, scale: 0.94, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -24, scale: 0.97, filter: 'blur(6px)' }}
              transition={{ duration: 0.55, ease: EASE_EXPO }}>
              <span className="ac-cycle-numero">{actif + 1}</span>
              <strong>{ETAPES[actif].titre}</strong>
              <span>{ETAPES[actif].texte}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default function Accueil() {
  const { estConnecte } = useAuth();
  const reduit = useReducedMotion();
  const [etatApi, setEtatApi] = useState('verification');
  const [defile, setDefile] = useState(false);
  const [sectionActive, setSectionActive] = useState(null);

  useEffect(() => {
    let actif = true;
    fetch(`${API_URL}/api/test`)
      .then((reponse) => { if (!reponse.ok) throw new Error(); })
      .then(() => actif && setEtatApi('operationnel'))
      .catch(() => actif && setEtatApi('indisponible'));
    return () => { actif = false; };
  }, []);

  // Barre de navigation : semi-transparente et floutée dès que l'on défile.
  const { scrollY } = useScroll();
  useEffect(() => scrollY.on('change', (v) => setDefile(v > 8)), [scrollY]);

  // Section visible -> lien actif du menu.
  useEffect(() => {
    const observateur = new IntersectionObserver((entrees) => {
      entrees.forEach((e) => { if (e.isIntersecting) setSectionActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach(({ id }) => { const el = document.getElementById(id); if (el) observateur.observe(el); });
    return () => observateur.disconnect();
  }, []);

  // Héros : parallaxe 3D pilotée par le scroll (vitesses différentes).
  const heros = useRef(null);
  const { scrollYProgress } = useScroll({ target: heros, offset: ['start start', 'end start'] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.5 });
  const texteY = useTransform(p, [0, 1], [0, -90]);
  const texteOpacite = useTransform(p, [0, 0.75], [1, 0]);
  const texteFlou = useTransform(p, [0, 1], ['blur(0px)', 'blur(8px)']);
  const carteY = useTransform(p, [0, 1], [0, 160]);
  const carteRotX = useTransform(p, [0, 1], [0, 16]);
  const carteRotY = useTransform(p, [0, 1], [-6, 6]);
  const carteEchelle = useTransform(p, [0, 1], [1, 0.9]);

  // Ruban : glisse en continu, et plus vite quand on fait défiler la page.
  const rubanX = useTransform(scrollY, (v) => `${-((v * 0.35) % 1200)}px`);

  // Lumière ambiante qui suit le curseur avec un léger retard.
  const sourisX = useMotionValue(-400);
  const sourisY = useMotionValue(-400);
  const lumX = useSpring(sourisX, { stiffness: 60, damping: 20, mass: 0.8 });
  const lumY = useSpring(sourisY, { stiffness: 60, damping: 20, mass: 0.8 });
  const lumiere = useMotionTemplate`radial-gradient(520px circle at ${lumX}px ${lumY}px, rgba(255, 197, 61, 0.22), transparent 70%)`;
  function suivreSouris(e) {
    if (reduit) return;
    const r = e.currentTarget.getBoundingClientRect();
    sourisX.set(e.clientX - r.left);
    sourisY.set(e.clientY - r.top);
  }

  const lienEspace = estConnecte ? '/pieces/nouvelle' : '/login';
  const texteEspace = estConnecte ? 'Ouvrir mon espace' : 'Se connecter';

  return (
    <div className="ac">
      <CurseurPersonnalise />

      <header className={`ac-nav ${defile ? 'ac-nav-defile' : ''}`}>
        <Link to="/" className="ac-nav-logo"><Logo /></Link>
        <nav className="ac-nav-liens" aria-label="Sections de la page">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={sectionActive === s.id ? 'actif' : ''}>
              {s.libelle}
              {sectionActive === s.id && <Soulignement />}
            </a>
          ))}
        </nav>
        <Magnetique><Link to={lienEspace} className="btn btn-primaire">{texteEspace}</Link></Magnetique>
      </header>

      <main>
        <section ref={heros} className="ac-heros" onMouseMove={suivreSouris}>
          {!reduit && <motion.div className="ac-lumiere" style={{ backgroundImage: lumiere }} aria-hidden="true" />}

          <motion.div className="ac-heros-texte" style={reduit ? undefined : { y: texteY, opacity: texteOpacite, filter: texteFlou }}>
            <TitreMots texte="La comptabilité et le contrôle de gestion de votre PME, dans un seul registre." />
            <motion.p variants={apparition} initial={reduit ? false : 'cache'} animate="visible" custom={0.75}>
              FinCo enregistre vos écritures en partie double selon le plan comptable CGNC,
              impute chaque charge sur un centre de coûts et suit vos budgets au fil de l’exercice.
            </motion.p>
            <motion.div className="ac-heros-actions" variants={apparition} initial={reduit ? false : 'cache'} animate="visible" custom={0.95}>
              <Magnetique><Link to={lienEspace} className="btn btn-primaire btn-heros">{texteEspace}</Link></Magnetique>
              <Magnetique><a href="#modules" className="btn btn-secondaire btn-heros">Découvrir les modules</a></Magnetique>
            </motion.div>
          </motion.div>

          <motion.div className="ac-scene"
            style={reduit ? undefined : { y: carteY, rotateX: carteRotX, rotateY: carteRotY, scale: carteEchelle, transformPerspective: 1400 }}>
            <motion.div className="ac-apercu" aria-label="Démonstration : une écriture en partie double s’équilibre"
              initial={reduit ? false : { opacity: 0, y: 60, rotateX: 22, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              transition={{ duration: 1.3, ease: EASE_EXPO, delay: 0.35 }}>
              <div className="ac-apercu-barre">
                <span>Pièce PC-2026-00017</span>
                <span className="texte-secondaire">Facture Cabinet Audit F-0917</span>
              </div>
              <EcritureAnimee />
            </motion.div>
          </motion.div>
        </section>

        {/* Ruban défilant (identité d'origine) : vitesse liée au défilement */}
        <div className="ac-ruban" aria-hidden="true">
          <motion.div className="ac-ruban-piste" style={reduit ? undefined : { x: rubanX }}>
            {[...TICKER, ...TICKER, ...TICKER].map((t, i) => <span key={i}>{t}<i>✦</i></span>)}
          </motion.div>
        </div>

        <section id="modules" className="ac-section">
          <div className="ac-section-tete">
            <TitreRevele>Deux modules, les mêmes écritures</TitreRevele>
            <motion.p variants={apparition} initial={reduit ? false : 'cache'} whileInView="visible" viewport={{ once: true }} custom={0.2}>
              Comme dans SAP, la finance et le contrôle de gestion partagent une seule source de vérité.
            </motion.p>
          </div>
          <div className="ac-modules">
            {MODULES.map((m, i) => (
              <Inclinable as="article" key={m.code} className="ac-module" max={3}
                variants={apparition} initial={reduit ? false : 'cache'} whileInView="visible"
                viewport={{ once: true, margin: '-80px' }} custom={delaiNonLineaire(i, MODULES.length, 0.25)}>
                <span className="ac-module-code">{m.code}</span>
                <h3>{m.titre}</h3>
                <p>{m.texte}</p>
                <ul>
                  {m.points.map((pt, j) => (
                    <motion.li key={pt} initial={reduit ? false : { opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE_EXPO, delay: 0.35 + delaiNonLineaire(j, m.points.length, 0.4) }}>
                      {pt}
                    </motion.li>
                  ))}
                </ul>
              </Inclinable>
            ))}
          </div>
        </section>

        <section id="fonctionnalites" className="ac-section ac-section-blanche">
          <div className="ac-section-tete">
            <TitreRevele>Ce que FinCo vérifie pour vous</TitreRevele>
            <motion.p variants={apparition} initial={reduit ? false : 'cache'} whileInView="visible" viewport={{ once: true }} custom={0.2}>
              Les règles comptables sont appliquées par le serveur, à chaque enregistrement.
            </motion.p>
          </div>
          <div className="ac-fonctions">
            {FONCTIONNALITES.map((f, i) => (
              <Inclinable as="article" key={f.titre} className="ac-fonction" max={4}
                variants={apparition} initial={reduit ? false : 'cache'} whileInView="visible"
                viewport={{ once: true, margin: '-60px' }} custom={delaiNonLineaire(i, FONCTIONNALITES.length, 0.6)}>
                <Icone nom={f.icone} />
                <h3>{f.titre}</h3>
                <p>{f.texte}</p>
              </Inclinable>
            ))}
          </div>
        </section>

        <CycleComptable />

        <motion.section className="ac-appel" initial={reduit ? false : { opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1, ease: EASE_EXPO }}>
          <div>
            <TitreRevele>Prêt à saisir votre première écriture ?</TitreRevele>
            <p>Connectez-vous avec votre email : un code de vérification vous est envoyé pour sécuriser l’accès.</p>
          </div>
          <Magnetique><Link to={lienEspace} className="btn ac-btn-blanc">{texteEspace}</Link></Magnetique>
        </motion.section>
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
