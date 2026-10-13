import { Navigate, Route, Routes } from 'react-router-dom';
import Accueil from './pages/Accueil.jsx';
import Login from './pages/Login.jsx';
import ListePieces from './pages/ListePieces.jsx';
import SaisiePiece from './pages/SaisiePiece.jsx';
import DetailPiece from './pages/DetailPiece.jsx';
import Tiers from './pages/Tiers.jsx';
import PlanComptable from './pages/PlanComptable.jsx';
import CentresCout from './pages/CentresCout.jsx';
import Exercices from './pages/Exercices.jsx';
import Budgets from './pages/Budgets.jsx';
import EspaceDaf from './pages/EspaceDaf.jsx';
import RouteProtegee from './components/RouteProtegee.jsx';
import MiseEnPageApp from './components/MiseEnPageApp.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { pageAccueilPourRole } from './config/roleAccess.js';

function RedirectionInconnue() {
  const { estConnecte, role } = useAuth();
  if (estConnecte) {
    return <Navigate to={pageAccueilPourRole(role)} replace />;
  }
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Pages publiques */}
      <Route path="/" element={<Accueil />} />
      <Route path="/login" element={<Login />} />

      {/* Pages connectées avec vérification du rôle (RBAC) */}
      <Route element={<RouteProtegee />}>
        <Route element={<MiseEnPageApp />}>
          {/* Module Comptabilité financière (COMPTABLE) */}
          <Route path="/pieces" element={<ListePieces />} />
          <Route path="/pieces/nouvelle" element={<SaisiePiece />} />
          <Route path="/pieces/:id" element={<DetailPiece />} />
          <Route path="/tiers" element={<Tiers />} />
          <Route path="/exercices" element={<Exercices />} />

          {/* Module Contrôle de gestion (CONTROLEUR) */}
          <Route path="/centres-cout" element={<CentresCout />} />
          <Route path="/budgets" element={<Budgets />} />

          {/* Module Administration (ADMIN) */}
          <Route path="/comptes" element={<PlanComptable />} />

          {/* Module Direction financière (DIRECTEUR_FINANCIER) */}
          <Route path="/direction" element={<EspaceDaf />} />
        </Route>
      </Route>

      {/* Redirection dynamique : vers la page d'accueil du rôle si connecté, sinon vers l'accueil public */}
      <Route path="*" element={<RedirectionInconnue />} />
    </Routes>
  );
}
