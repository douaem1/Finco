import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messageErreur } from '../services/api';
import ChampSaisie from '../components/ChampSaisie';
import MessageErreur from '../components/MessageErreur';

/* Comptes de démonstration (créés par DonneesInitiales côté serveur). */
const COMPTES_DEMO = [
  { login: 'comptable', role: 'Comptable', couleur: 'corail' },
  { login: 'controleur', role: 'Contrôleur', couleur: 'sarcelle' },
  { login: 'daf', role: 'Directeur fin.', couleur: 'jaune' },
  { login: 'admin', role: 'Admin', couleur: 'lilas' },
];

export default function Login() {
  const { connexion, estConnecte } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const [login, setLogin] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState(params.get('expire') ? 'Votre session a expiré, reconnectez-vous.' : '');
  const [envoi, setEnvoi] = useState(false);

  if (estConnecte) return <Navigate to="/pieces" replace />;

  async function soumettre(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      await connexion(login, motDePasse);
      navigate(location.state?.depuis || '/pieces', { replace: true });
    } catch (err) {
      setErreur(messageErreur(err)); // ex. « Identifiant ou mot de passe incorrect. »
    } finally {
      setEnvoi(false);
    }
  }

  function remplirDemo(compte) {
    setLogin(compte.login);
    setMotDePasse('admin123');
    setErreur('');
  }

  // Aide d'ergonomie autorisée : bouton désactivé si un champ est vide.
  const incomplet = !login.trim() || !motDePasse;

  return (
    <div className="f-login">
      <span className="f-forme f-forme-cercle" aria-hidden="true" />
      <span className="f-forme f-forme-croix" aria-hidden="true">+</span>

      <section className="f-login-carte">
        <Link to="/" className="f-logo">
          <span className="f-tampon">F</span>
          <span>Fin<b>Co</b></span>
        </Link>

        <h1>Bon retour <span className="f-surligne">parmi nous</span></h1>
        <p className="f-muet">Connectez-vous pour saisir et consulter les écritures.</p>

        <form onSubmit={soumettre} className="f-pile">
          <ChampSaisie id="login" label="Identifiant" autoComplete="username" autoFocus
            value={login} onChange={(e) => setLogin(e.target.value)} placeholder="ex. comptable" />
          <ChampSaisie id="mdp" label="Mot de passe" type="password" autoComplete="current-password"
            value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="••••••••" />

          <MessageErreur message={erreur} />

          <button type="submit" className="f-btn f-btn-noir f-btn-large" disabled={incomplet || envoi}>
            {envoi ? 'Connexion…' : 'Se connecter →'}
          </button>
        </form>

        
      </section>

      <aside className="f-login-visuel" aria-hidden="true">
        <div className="f-papier f-ticket">
          <div className="f-ticket-entete">
            <span>Écriture n° PC-2026-00042</span>
            <span className="f-tampon-texte">ÉQUILIBRÉE</span>
          </div>
          <div className="f-ticket-ligne"><span>6136 · Honoraires</span><b>30 000,00</b><i /></div>
          <div className="f-ticket-ligne"><span>34552 · TVA récup.</span><b>6 000,00</b><i /></div>
          <div className="f-ticket-ligne"><span>4411 · Fournisseurs</span><i /><b>36 000,00</b></div>
          <div className="f-ticket-total"><span>Σ</span><b>36 000,00</b><b>36 000,00</b></div>
        </div>
        <p className="f-login-slogan">Débit = Crédit.<br /><em>Toujours.</em></p>
      </aside>
    </div>
  );
}
