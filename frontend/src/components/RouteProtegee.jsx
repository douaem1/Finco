import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Redirige vers /login si personne n'est connecté.
 * Confort d'affichage seulement : la vraie protection est côté serveur
 * (sans jeton valide, l'API répond 401).
 */
export default function RouteProtegee() {
  const { estConnecte } = useAuth();
  const location = useLocation();

  if (!estConnecte) {
    return <Navigate to="/login" replace state={{ depuis: location.pathname }} />;
  }
  return <Outlet />;
}
