import { lazy, Suspense } from 'react';
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
import Utilisateurs from './pages/Utilisateurs.jsx';
import Factures from './pages/Factures.jsx';
import Paiements from './pages/Paiements.jsx';
import GrandLivre from './pages/GrandLivre.jsx';
import RepartitionCouts from './pages/RepartitionCouts.jsx';
import RapportsAnalytiques from './pages/RapportsAnalytiques.jsx';
import ValidationPaiements from './pages/ValidationPaiements.jsx';
import Kit from './pages/Kit.jsx';
import AccesInterdit from './pages/AccesInterdit.jsx';
import PageIntrouvable from './pages/PageIntrouvable.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import RouteProtegee from './components/RouteProtegee.jsx';
import MiseEnPageApp from './components/MiseEnPageApp.jsx';

const ComptableDashboard = lazy(() => import('./pages/dashboard/ComptableDashboard.jsx'));
const ControleurDashboard = lazy(() => import('./pages/dashboard/ControleurDashboard.jsx'));
const DirecteurDashboard = lazy(() => import('./pages/dashboard/DirecteurDashboard.jsx'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard.jsx'));
const chargementDashboard = <div className="chargement">Chargement du tableau de bord…</div>;

export default function App() {
  return <ErrorBoundary><Routes>
    <Route path="/" element={<Accueil />} />
    <Route path="/login" element={<Login />} />
    <Route path="/403" element={<AccesInterdit />} />
    <Route element={<RouteProtegee />}><Route element={<MiseEnPageApp />}>
      {import.meta.env.DEV && <Route path="/__kit" element={<Kit />} />}
      <Route path="/dashboard/comptable" element={<Suspense fallback={chargementDashboard}><ComptableDashboard /></Suspense>} />
      <Route path="/dashboard/controleur" element={<Suspense fallback={chargementDashboard}><ControleurDashboard /></Suspense>} />
      <Route path="/dashboard/directeur" element={<Suspense fallback={chargementDashboard}><DirecteurDashboard /></Suspense>} />
      <Route path="/dashboard/admin" element={<Suspense fallback={chargementDashboard}><AdminDashboard /></Suspense>} />
      <Route path="/pieces" element={<ListePieces />} />
      <Route path="/pieces/nouvelle" element={<SaisiePiece />} />
      <Route path="/pieces/:id" element={<DetailPiece />} />
      <Route path="/tiers" element={<Tiers />} />
      <Route path="/exercices" element={<Exercices />} />
      <Route path="/factures" element={<Factures />} />
      <Route path="/paiements" element={<Paiements />} />
      <Route path="/grand-livre" element={<GrandLivre />} />
      <Route path="/centres-cout" element={<CentresCout />} />
      <Route path="/budgets" element={<Budgets />} />
      <Route path="/repartition-couts" element={<RepartitionCouts />} />
      <Route path="/rapports-analytiques" element={<RapportsAnalytiques />} />
      <Route path="/comptes" element={<PlanComptable />} />
      <Route path="/utilisateurs" element={<Utilisateurs />} />
      <Route path="/direction" element={<Navigate to="/dashboard/directeur" replace />} />
      <Route path="/tableau-de-bord" element={<Navigate to="/dashboard/directeur" replace />} />
      <Route path="/validation-paiements" element={<ValidationPaiements />} />
    </Route></Route>
    <Route path="*" element={<PageIntrouvable />} />
  </Routes></ErrorBoundary>;
}
