import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { estRouteAutorisee, pageAccueilPourRole } from '../config/roleAccess';

/**
 * Garde de route globale :
 * 1. Vérifie l'authentification (si non connecté -> redirection /login).
 * 2. Vérifie les permissions RBAC selon le rôle officiel de l'utilisateur.
 * 3. Si l'accès est refusé, redirige immédiatement vers la page d'accueil du rôle
 *    avec un message d'alerte discret (aucune page interdite n'est montée).
 */
export default function RouteProtegee() {
  const { estConnecte, role } = useAuth();
  const location = useLocation();

  if (!estConnecte) {
    return <Navigate to="/login" replace state={{ depuis: location.pathname }} />;
  }

  // Vérification stricte du rôle d'après la source de vérité roleAccess.js
  const autorise = estRouteAutorisee(location.pathname, role);

  if (!autorise) {
    const destination = pageAccueilPourRole(role);
    return (
      <Navigate
        to={destination}
        replace
        state={{ messageAccesRefuse: 'Accès non autorisé : cette page n’est pas attribuée à votre rôle.' }}
      />
    );
  }

  return <Outlet />;
}
