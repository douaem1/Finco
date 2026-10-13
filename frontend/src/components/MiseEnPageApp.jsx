import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LIBELLES_ROLES, initiales, nomAffiche } from '../utils/format';
import { obtenirSectionsMenuPourRole } from '../config/roleAccess';
import Logo from './Logo';
import Icone from './Icone';
import MessageErreur from './MessageErreur';

/** Cadre des pages connectées : barre latérale filtrée par rôle + zone de travail. */
export default function MiseEnPageApp() {
  const { utilisateur, role, deconnexion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [messageRefus, setMessageRefus] = useState(location.state?.messageAccesRefuse || '');

  useEffect(() => {
    if (location.state?.messageAccesRefuse) {
      setMessageRefus(location.state.messageAccesRefuse);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  function quitter() {
    deconnexion();
    navigate('/login', { replace: true });
  }

  // Filtrage strict : seules les sections contenant des liens autorisés pour ce rôle sont conservées
  const sections = obtenirSectionsMenuPourRole(role);

  return (
    <div className="app">
      <aside className="lateral">
        <div className="lateral-logo"><Logo /></div>

        <nav className="lateral-nav" aria-label="Navigation principale">
          {sections.map((section) => (
            <React.Fragment key={section.nom}>
              <p className="lateral-groupe">{section.nom}</p>
              {section.items.map((item) => (
                <NavLink key={item.path} to={item.path} end={item.end}>
                  <Icone nom={item.icone} /> {item.libelle}
                </NavLink>
              ))}
            </React.Fragment>
          ))}
        </nav>

        <div className="lateral-profil">
          <span className="avatar" aria-hidden="true">{initiales(utilisateur)}</span>
          <span className="lateral-profil-texte">
            <strong>{nomAffiche(utilisateur)}</strong>
            <small>{LIBELLES_ROLES[role] ?? role}</small>
          </span>
          <button
            type="button"
            className="lateral-sortie"
            onClick={quitter}
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <Icone nom="sortie" />
          </button>
        </div>
      </aside>

      <main className="contenu">
        {messageRefus && (
          <div style={{ marginBottom: '1.5rem' }}>
            <MessageErreur message={messageRefus} onFermer={() => setMessageRefus('')} />
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
