import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { estRouteAutorisee } from '../config/roleAccess';

export default function RouteProtegee() {
  const { estConnecte, role } = useAuth();
  const location = useLocation();

  if (!estConnecte) return <Navigate to="/login" replace state={{ depuis: location.pathname }} />;
  if (!estRouteAutorisee(location.pathname, role)) {
    return <Navigate to="/403" replace state={{ messageAccesRefuse: 'Accès non autorisé.' }} />;
  }
  return <Outlet />;
}
