import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LIBELLES_ROLES, initiales, nomAffiche } from '../utils/format';
import Logo from './Logo';
import Icone from './Icone';

/** Cadre des pages connectées : barre latérale bleue + zone de travail. */
export default function MiseEnPageApp() {
  const { utilisateur, deconnexion } = useAuth();
  const navigate = useNavigate();

  function quitter() {
    deconnexion();
    navigate('/login');
  }

  return (
    <div className="app">
      <aside className="lateral">
        <div className="lateral-logo"><Logo variante="inverse" /></div>

        <nav className="lateral-nav" aria-label="Navigation principale">
          <p className="lateral-groupe">Comptabilité financière</p>
          <NavLink to="/pieces" end><Icone nom="journal" /> Journal</NavLink>
          <NavLink to="/pieces/nouvelle"><Icone nom="plus" /> Nouvelle écriture</NavLink>

          <p className="lateral-groupe">Contrôle de gestion</p>
          <span className="lateral-bientot" title="Disponible prochainement"><Icone nom="centres" /> Centres de coûts <em>bientôt</em></span>
        </nav>

        <div className="lateral-profil">
          <span className="avatar" aria-hidden="true">{initiales(utilisateur)}</span>
          <span className="lateral-profil-texte">
            <strong>{nomAffiche(utilisateur)}</strong>
            <small>{LIBELLES_ROLES[utilisateur?.role] ?? utilisateur?.role}</small>
          </span>
          <button type="button" className="lateral-sortie" onClick={quitter} title="Se déconnecter" aria-label="Se déconnecter">
            <Icone nom="sortie" />
          </button>
        </div>
      </aside>

      <main className="contenu">
        <Outlet />
      </main>
    </div>
  );
}
