import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { estRouteAutorisee, pageAccueilPourRole } from '../config/roleAccess';
import { demanderCode, renvoyerCode } from '../services/authApi';
import { messageErreur } from '../services/api';
import { minutesSecondes } from '../utils/format';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { EcritureAnimee } from '../components/Balance';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';
import MessageErreur from '../components/MessageErreur';
import SaisieCode from '../components/SaisieCode';

/* ============================================================
   Connexion en deux étapes :
   1. email + mot de passe  -> le serveur envoie un code par email
   2. code à 6 chiffres     -> le serveur renvoie le jeton JWT
   ============================================================ */

export default function Login() {
  const { finaliserConnexion, estConnecte, role } = useAuth();
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

  if (estConnecte) return <Navigate to={pageAccueilPourRole(role)} replace />;

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
      const utilisateur = await finaliserConnexion(otp.jetonOtp, code);
      const userRole = utilisateur?.role;
      const pageParDefaut = pageAccueilPourRole(userRole);
      const depuis = location.state?.depuis;
      const destination = (depuis && estRouteAutorisee(depuis, userRole)) ? depuis : pageParDefaut;
      navigate(destination, { replace: true });
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
      <div className="connexion-theme-flottant"><ThemeToggle /></div>
      <aside className="connexion-registre" aria-hidden="true">
        <Logo />
        <div className="registre-contenu">
          <p className="registre-titre">Chaque écriture trouve son équilibre.</p>
          <p className="registre-texte">
            Saisie en partie double selon le plan comptable CGNC, imputation des charges
            par centre de coûts et suivi budgétaire, pour les PME marocaines.
          </p>
          <EcritureAnimee />
        </div>
        <p className="registre-pied">Connexion protégée par code à usage unique</p>
      </aside>

      <main className="connexion-panneau">
        <div className="connexion-boite">
          <Link to="/" className="connexion-logo-mobile"><Logo /></Link>

          <ol className="etapes-connexion" aria-label="Étapes de connexion">
            <li className={etape === 'identifiants' ? 'en-cours' : 'faite'} aria-current={etape === 'identifiants' ? 'step' : undefined}>Identifiants</li>
            <li className={etape === 'code' ? 'en-cours' : ''} aria-current={etape === 'code' ? 'step' : undefined}>Code de vérification</li>
          </ol>

          {etape === 'identifiants' ? (
            <form onSubmit={envoyerIdentifiants} className="pile connexion-formulaire">
              <div>
                <h1>Connexion</h1>
                <p className="texte-secondaire">Accédez à votre espace comptable FinCo.</p>
              </div>

              <Field id="email" label="Adresse email">
                {({ id, ...champ }) => (
                  <input id={id} className="input" type="email" autoComplete="username" autoFocus
                    value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@entreprise.ma" {...champ} />
                )}
              </Field>

              <Field id="mdp" label="Mot de passe">
                {({ id, ...champ }) => (
                  <div className="champ-avec-bouton">
                    <input id={id} className="input" type={voirMdp ? 'text' : 'password'} autoComplete="current-password"
                      value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} {...champ} />
                    <button type="button" className="bouton-oeil" onClick={() => setVoirMdp((v) => !v)}
                      aria-pressed={voirMdp} aria-label={voirMdp ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {voirMdp
                          ? <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 002.8 2.8" /><path d="M9.4 5.4A9.7 9.7 0 0112 5c5 0 9 4.5 9 7a11 11 0 01-2.4 3.4M6.1 6.6A11.4 11.4 0 003 12c0 2.5 4 7 9 7a9.6 9.6 0 004-.9" /></>
                          : <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>}
                      </svg>
                    </button>
                  </div>
                )}
              </Field>

              <MessageErreur message={erreur} />

              {/* Ergonomie autorisée : bouton désactivé si un champ est vide. */}
              <Button type="submit" variant="primary" disabled={!email.trim() || !motDePasse || envoi}>
                {envoi ? 'Vérification…' : 'Continuer'}
              </Button>
            </form>
          ) : (
            <form onSubmit={envoyerCode} className="pile connexion-formulaire">
              <div>
                <h1>Vérification</h1>
                <p className="texte-secondaire">
                  Saisissez le code à 6 chiffres envoyé à <strong>{otp?.emailMasque}</strong>.
                </p>
              </div>

              <SaisieCode valeur={code} onChange={setCode} desactive={envoi} enErreur={Boolean(erreur)}
                ariaDescribedby="code-etat" />

              <div id="code-etat" className="connexion-statuts" aria-live="polite">
                <p className={`validite ${resteValidite <= 60 ? 'validite-proche' : ''}`}>
                  {resteValidite > 0
                    ? <>Code valable encore <strong>{minutesSecondes(resteValidite)}</strong></>
                    : 'Le code a expiré. Demandez-en un nouveau.'}
                </p>
                {info && <p className="message-info" role="status">{info}</p>}
              </div>

              <MessageErreur message={erreur} />

              <Button type="submit" variant="primary" disabled={code.length !== 6 || envoi}>
                {envoi ? 'Connexion…' : 'Se connecter'}
              </Button>

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
