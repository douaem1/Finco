import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LIBELLES_ROLES } from '../utils/format';

/** Cadre commun des pages connectées : barre du haut + contenu. */
export default function MiseEnPageApp() {
  const { utilisateur, deconnexion } = useAuth();
  const navigate = useNavigate();

  function quitter() {
    deconnexion();
    navigate('/login');
  }

  const initiales = (utilisateur?.nomComplet || '?')
    .split(' ').map((mot) => mot[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="f-app">
      <header className="f-barre">
        <Link to="/" className="f-logo">
          <span className="f-tampon">F</span>
          <span>Fin<b>Co</b></span>
        </Link>

        <nav className="f-menu">
          <NavLink to="/pieces" end>Journal</NavLink>
          <NavLink to="/pieces/nouvelle">Nouvelle écriture</NavLink>
        </nav>

        <div className="f-profil">
          <span className="f-avatar" aria-hidden="true">{initiales}</span>
          <span className="f-profil-texte">
            <b>{utilisateur?.nomComplet}</b>
            <small>{LIBELLES_ROLES[utilisateur?.role] ?? utilisateur?.role}</small>
          </span>
          <button type="button" className="f-btn f-btn-petit" onClick={quitter}>Déconnexion</button>
        </div>
      </header>

      <main className="f-contenu">
        <Outlet />
      </main>
    </div>
  );
}
