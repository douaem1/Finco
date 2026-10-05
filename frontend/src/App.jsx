import { Navigate, Route, Routes } from 'react-router-dom';
import Accueil from './pages/Accueil.jsx';
import Login from './pages/Login.jsx';
import ListePieces from './pages/ListePieces.jsx';
import SaisiePiece from './pages/SaisiePiece.jsx';
import DetailPiece from './pages/DetailPiece.jsx';
import RouteProtegee from './components/RouteProtegee.jsx';
import MiseEnPageApp from './components/MiseEnPageApp.jsx';

export default function App() {
  return (
    <Routes>
      {/* Pages publiques */}
      <Route path="/" element={<Accueil />} />
      <Route path="/login" element={<Login />} />

      {/* Pages réservées aux utilisateurs connectés */}
      <Route element={<RouteProtegee />}>
        <Route element={<MiseEnPageApp />}>
          <Route path="/pieces" element={<ListePieces />} />
          <Route path="/pieces/nouvelle" element={<SaisiePiece />} />
          <Route path="/pieces/:id" element={<DetailPiece />} />
          {/* TODO : /centres, /centres/nouveau, /centres/:id */}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
