import { Fragment, useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PAGES, obtenirSectionsMenuPourRole } from '../config/roleAccess';
import { listerExercices } from '../services/exerciceApi';
import { useNotifications } from '../hooks/useNotifications';
import { LogoMarque } from './Logo';
import Icone from './Icone';
import MessageErreur from './MessageErreur';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';
import Tooltip from './ui/Tooltip';

const CLE_REPLI = 'finco.lateral.replie';

/** Lecture de la préférence d'affichage (stockage local, tolérant aux erreurs). */
function lireRepli() {
  try {
    return window.localStorage.getItem(CLE_REPLI) === '1';
  } catch {
    return false;
  }
}

function ecrireRepli(valeur) {
  try {
    window.localStorage.setItem(CLE_REPLI, valeur ? '1' : '0');
  } catch {
    /* stockage local indisponible : la préférence reste en mémoire */
  }
}

export default function MiseEnPageApp() {
  const { utilisateur, role, deconnexion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [messageRefus, setMessageRefus] = useState(location.state?.messageAccesRefuse || '');
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const [lateralReplie, setLateralReplie] = useState(lireRepli);
  const [exercices, setExercices] = useState([]);
  const { items: notifications, compteur: notificationsNonLues, chargerListe, marquerLue, toutMarquerLu } = useNotifications();

  useEffect(() => {
    if (location.state?.messageAccesRefuse) {
      setMessageRefus(location.state.messageAccesRefuse);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    listerExercices().then(setExercices).catch(() => setExercices([]));
  }, []);

  // Le tiroir mobile se referme à chaque changement de page.
  useEffect(() => {
    setMenuMobileOuvert(false);
  }, [location.pathname]);

  // Échap ferme le tiroir mobile.
  useEffect(() => {
    if (!menuMobileOuvert) return undefined;
    function surTouche(evenement) {
      if (evenement.key === 'Escape') setMenuMobileOuvert(false);
    }
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [menuMobileOuvert]);

  function basculerLateral() {
    setLateralReplie((valeur) => {
      ecrireRepli(!valeur);
      return !valeur;
    });
  }

  function quitter() {
    deconnexion();
    navigate('/login', { replace: true });
  }

  function toutMarquerNotificationsLues() {
    toutMarquerLu();
  }

  function ouvrirNotification(item) {
    marquerLue(item.id);
    if (item.lien) navigate(item.lien);
  }

  const sections = useMemo(() => {
    const groupes = new Map();
    obtenirSectionsMenuPourRole(role).forEach((section) => section.items.forEach((item) => {
      const nom = item.path === '/tiers' ? 'Tiers' : section.nom === 'Comptabilité financière' ? 'Comptabilité' : section.nom === 'Direction financière' ? 'Direction' : section.nom;
      if (!groupes.has(nom)) groupes.set(nom, []);
      groupes.get(nom).push(item);
    }));
    return Array.from(groupes, ([nom, items]) => ({ nom, items }));
  }, [role]);

  const page = PAGES.find((item) => (item.pattern ? item.pattern.test(location.pathname) : item.path === location.pathname));
  const aujourdHui = new Date().toISOString().slice(0, 10);
  const exercice = exercices.find((item) => item.dateDebut <= aujourdHui && item.dateFin >= aujourdHui) || exercices[0];

  return <div className={`coque ${lateralReplie ? 'coque-replie' : ''}`}>
    <a className="lien-saut" href="#contenu-principal">Aller au contenu</a>
    {menuMobileOuvert && <button type="button" className="coque-voile" aria-label="Fermer le menu" onClick={() => setMenuMobileOuvert(false)} />}
    <aside id="navigation-principale" className={`lateral ${lateralReplie ? 'lateral-replie' : ''} ${menuMobileOuvert ? 'lateral-mobile-ouvert' : ''}`}>
      <div className="lateral-marque">
        <LogoMarque taille={32} />
        <span className="lateral-marque-nom">FinCo</span>
      </div>
      <nav className="lateral-menu" aria-label="Navigation principale">
        {sections.map((section) => <Fragment key={section.nom}>
          <p className="lateral-section">{section.nom}</p>
          <span className="lateral-section-trait" aria-hidden="true" />
          {section.items.map((item) => <Tooltip key={item.path} label={item.libelle} disabled={!lateralReplie}>
            <NavLink to={item.path} end={item.end} onClick={() => setMenuMobileOuvert(false)}>
              <span className="lateral-icone"><Icone nom={item.icone} taille={20} /></span>
              <span className="lateral-libelle">{item.libelle}</span>
            </NavLink>
          </Tooltip>)}
        </Fragment>)}
      </nav>
      <button type="button" className="lateral-bascule" onClick={basculerLateral} aria-label={lateralReplie ? 'Développer le menu' : 'Réduire le menu'} aria-expanded={!lateralReplie} aria-controls="navigation-principale">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        <span className="lateral-bascule-texte">Réduire</span>
      </button>
    </aside>
    <div className="zone-principale">
      <header className="barre-sup">
        <div className="barre-sup-gauche">
          <button type="button" className="barre-sup-mobile" onClick={() => setMenuMobileOuvert(true)} aria-label="Ouvrir le menu" aria-expanded={menuMobileOuvert} aria-controls="navigation-principale">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <nav className="fil-ariane" aria-label="Fil d’Ariane"><span>FinCo</span>{page?.libelle && <><span aria-hidden="true">/</span><strong>{page.libelle}</strong></>}</nav>
        </div>
        <div className="barre-sup-actions">
          <div className="exercice-puce">
            <span className={`exercice-point ${exercice?.cloture ? 'exercice-point-ferme' : 'exercice-point-ouvert'}`} aria-hidden="true" />
            <span>Exercice</span>
            <strong>{exercice?.annee ?? new Date().getFullYear()}</strong>
            <small>{exercice?.cloture ? 'Clôturée' : 'Ouverte'}</small>
          </div>
          <NotificationBell
            items={notifications}
            compteur={notificationsNonLues}
            onOuvrir={chargerListe}
            onToutMarquerLu={toutMarquerNotificationsLues}
            onOuvrirNotification={ouvrirNotification}
          />
          <UserMenu utilisateur={utilisateur} role={role} onLogout={quitter} />
        </div>
      </header>
      {messageRefus && <div className="coque-message"><MessageErreur message={messageRefus} onFermer={() => setMessageRefus('')} /></div>}
      <main id="contenu-principal" className="contenu">
        <Outlet />
      </main>
    </div>
  </div>;
}
