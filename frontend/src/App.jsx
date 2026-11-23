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
import Utilisateurs from './pages/Utilisateurs.jsx';
import TableauDeBord from './pages/TableauDeBord.jsx';
import Factures from './pages/Factures.jsx';
import Paiements from './pages/Paiements.jsx';
import GrandLivre from './pages/GrandLivre.jsx';
import RepartitionCouts from './pages/RepartitionCouts.jsx';
import RapportsAnalytiques from './pages/RapportsAnalytiques.jsx';
import ValidationPaiements from './pages/ValidationPaiements.jsx';
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
          <Route path="/factures" element={<Factures />} />
          <Route path="/paiements" element={<Paiements />} />
          <Route path="/grand-livre" element={<GrandLivre />} />

          {/* Module Contrôle de gestion (CONTROLEUR) */}
          <Route path="/centres-cout" element={<CentresCout />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/repartition-couts" element={<RepartitionCouts />} />
          <Route path="/rapports-analytiques" element={<RapportsAnalytiques />} />

          {/* Module Administration (ADMIN) */}
          <Route path="/comptes" element={<PlanComptable />} />
          <Route path="/admin/tableau-de-bord" element={<TableauDeBord />} />
          <Route path="/utilisateurs" element={<Utilisateurs />} />

          {/* Module Direction financière (DIRECTEUR_FINANCIER) */}
          <Route path="/direction" element={<Navigate to="/tableau-de-bord" replace />} />
          <Route path="/tableau-de-bord" element={<EspaceDaf />} />
          <Route path="/validation-paiements" element={<ValidationPaiements />} />
        </Route>
      </Route>

      {/* Redirection dynamique : vers la page d'accueil du rôle si connecté, sinon vers l'accueil public */}
      <Route path="*" element={<RedirectionInconnue />} />
    </Routes>
  );
}
