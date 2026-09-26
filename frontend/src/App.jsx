import { Routes, Route } from 'react-router-dom';
import Accueil from './pages/Accueil.jsx';

export default function App() {
  return (
    <Routes>
      {/* Page d'accueil publique */}
      <Route path="/" element={<Accueil />} />
      {/* TODO : brancher ici /login, /ecritures, /factures, ... */}
    </Routes>
  );
}
