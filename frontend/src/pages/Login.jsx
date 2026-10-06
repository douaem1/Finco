import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { demanderCode, renvoyerCode } from '../services/authApi';
import { messageErreur } from '../services/api';
import { minutesSecondes } from '../utils/format';
import Logo from '../components/Logo';
import { EcritureAnimee } from '../components/Balance';
import ChampSaisie from '../components/ChampSaisie';
import MessageErreur from '../components/MessageErreur';
import SaisieCode from '../components/SaisieCode';

/* ============================================================
   Connexion en deux étapes :
   1. email + mot de passe  -> le serveur envoie un code par email
   2. code à 6 chiffres     -> le serveur renvoie le jeton JWT
   ============================================================ */

export default function Login() {
  const { finaliserConnexion, estConnecte } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const [etape, setEtape] = useState('identifiants'); // 'identifiants' | 'code'
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [voirMdp, setVoirMdp] = useState(false);
  const [otp, setOtp] = useState(null); // { jetonOtp, emailMasque, validiteSecondes, renvoiDansSecondes }
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState(params.get('expire') ? 'Votre session a expiré. Reconnectez-vous.' : '');
  const [info, setInfo] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [maintenant, setMaintenant] = useState(Date.now());

  // Horloge pour les comptes à rebours (validité du code, délai de renvoi).
  useEffect(() => {
    if (etape !== 'code') return undefined;
    const minuterie = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(minuterie);
  }, [etape]);

  if (estConnecte) return <Navigate to="/pieces" replace />;

  function recevoirOtp(reponse) {
    const t = Date.now();
    setOtp({ ...reponse, expireA: t + reponse.validiteSecondes * 1000, renvoiA: t + reponse.renvoiDansSecondes * 1000 });
    setMaintenant(t);
  }

  async function envoyerIdentifiants(e) {
    e.preventDefault();
    setErreur(''); setInfo(''); setEnvoi(true);
    try {
      recevoirOtp(await demanderCode(email, motDePasse));
      setCode('');
      setEtape('code');
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  }

  async function envoyerCode(e) {
    e.preventDefault();
    setErreur(''); setInfo(''); setEnvoi(true);
    try {
      await finaliserConnexion(otp.jetonOtp, code);
      navigate(location.state?.depuis || '/pieces', { replace: true });
    } catch (err) {
      setErreur(messageErreur(err)); // ex. « Code incorrect. Il vous reste 3 essais. »
      setCode('');
    } finally {
      setEnvoi(false);
    }
  }

  async function demanderNouveauCode() {
    setErreur(''); setInfo('');
    try {
      recevoirOtp(await renvoyerCode(otp.jetonOtp));
      setCode('');
      setInfo('Un nouveau code vous a été envoyé.');
    } catch (err) {
      setErreur(messageErreur(err));
    }
  }

  function changerDeCompte() {
    setEtape('identifiants'); setOtp(null); setCode(''); setErreur(''); setInfo('');
  }

  const resteValidite = otp ? (otp.expireA - maintenant) / 1000 : 0;
  const resteRenvoi = otp ? Math.ceil((otp.renvoiA - maintenant) / 1000) : 0;

  return (
    <div className="connexion">
      <aside className="connexion-registre" aria-hidden="true">
        <Logo variante="inverse" />
        <div className="registre-contenu">
          <p className="registre-titre">Chaque écriture trouve son équilibre.</p>
          <p className="registre-texte">
            Saisie en partie double selon le plan comptable CGNC, imputation des charges
            par centre de coûts et suivi budgétaire, pour les PME marocaines.
          </p>
          <EcritureAnimee inverse />
        </div>
        <p className="registre-pied">Connexion protégée par code à usage unique</p>
      </aside>

      <main className="connexion-panneau">
        <div className="connexion-boite">
          <Link to="/" className="connexion-logo-mobile"><Logo /></Link>

          <ol className="etapes-connexion" aria-label="Étapes de connexion">
            <li className={etape === 'identifiants' ? 'en-cours' : 'faite'}>Identifiants</li>
            <li className={etape === 'code' ? 'en-cours' : ''}>Code de vérification</li>
          </ol>

          {etape === 'identifiants' ? (
            <form onSubmit={envoyerIdentifiants} className="pile">
              <div>
                <h1>Connexion</h1>
                <p className="texte-secondaire">Accédez à votre espace comptable FinCo.</p>
              </div>

              <ChampSaisie id="email" label="Adresse email" type="email" autoComplete="username" autoFocus
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@entreprise.ma" />

              <div className="champ">
                <label className="champ-label" htmlFor="mdp">Mot de passe</label>
                <div className="champ-avec-bouton">
                  <input id="mdp" className="input" type={voirMdp ? 'text' : 'password'} autoComplete="current-password"
                    value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
                  <button type="button" className="bouton-texte" onClick={() => setVoirMdp((v) => !v)}
                    aria-pressed={voirMdp}>
                    {voirMdp ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
              </div>

              <MessageErreur message={erreur} />

              {/* Ergonomie autorisée : bouton désactivé si un champ est vide. */}
              <button type="submit" className="btn btn-primaire btn-large" disabled={!email.trim() || !motDePasse || envoi}>
                {envoi ? 'Vérification…' : 'Continuer'}
              </button>
            </form>
          ) : (
            <form onSubmit={envoyerCode} className="pile">
              <div>
                <h1>Vérification</h1>
                <p className="texte-secondaire">
                  Saisissez le code à 6 chiffres envoyé à <strong>{otp?.emailMasque}</strong>.
                </p>
              </div>

              <SaisieCode valeur={code} onChange={setCode} desactive={envoi} enErreur={Boolean(erreur)} />

              <p className={`validite ${resteValidite <= 60 ? 'validite-proche' : ''}`}>
                {resteValidite > 0
                  ? <>Code valable encore <strong>{minutesSecondes(resteValidite)}</strong></>
                  : 'Le code a expiré. Demandez-en un nouveau.'}
              </p>

              <MessageErreur message={erreur} />
              {info && <p className="message-info" role="status">{info}</p>}

              <button type="submit" className="btn btn-primaire btn-large" disabled={code.length !== 6 || envoi}>
                {envoi ? 'Connexion…' : 'Se connecter'}
              </button>

              <div className="liens-code">
                <button type="button" className="bouton-texte" onClick={demanderNouveauCode} disabled={resteRenvoi > 0}>
                  {resteRenvoi > 0 ? `Renvoyer le code (${resteRenvoi} s)` : 'Renvoyer le code'}
                </button>
                <button type="button" className="bouton-texte" onClick={changerDeCompte}>Changer de compte</button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
