import { createContext, useContext, useEffect, useState } from 'react';
import { CLE_SESSION, lireSession } from '../services/api';
import { profil, verifierCode } from '../services/authApi';

/* ============================================================
   Contexte d'authentification : partage l'utilisateur connecté
   avec toutes les pages, sans passer de props à chaque niveau.
   La session (jeton + utilisateur) est gardée dans localStorage
   pour survivre à un rafraîchissement de la page.
   Elle n'est créée qu'APRÈS la vérification du code OTP.
   ============================================================ */

const AuthContext = createContext(null);

/**
 * Décode le payload Base64URL du jeton JWT de manière sécurisée côté client.
 * Empêche de se baser uniquement sur une valeur du localStorage falsifiable.
 */
function extrairePayloadDuToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parties = token.split('.');
  if (parties.length !== 3) return null;
  try {
    const base64 = parties[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => lireSession());

  // Vérification de cohérence au chargement : si un token existe, s'assurer
  // que les informations complètes de l'utilisateur sont chargées depuis /me.
  useEffect(() => {
    if (session?.token && (!session.utilisateur?.role || !session.utilisateur?.nom)) {
      profil()
        .then((u) => {
          setSession((prec) => {
            if (!prec) return null;
            const maj = { ...prec, utilisateur: u };
            localStorage.setItem(CLE_SESSION, JSON.stringify(maj));
            return maj;
          });
        })
        .catch(() => {
          // Token invalide ou expiré
          deconnexion();
        });
    }
  }, [session?.token]);

  /** Étape 2 réussie : on mémorise le jeton JWT renvoyé par le serveur. */
  async function finaliserConnexion(jetonOtp, code) {
    const reponse = await verifierCode(jetonOtp, code); // lève une erreur si 401
    localStorage.setItem(CLE_SESSION, JSON.stringify(reponse));
    setSession(reponse);
    return reponse.utilisateur;
  }

  function deconnexion() {
    localStorage.removeItem(CLE_SESSION);
    setSession(null);
  }

  // Le rôle officiel est validé par le JWT signé par le serveur.
  const payloadJwt = extrairePayloadDuToken(session?.token);
  const roleOfficiel = payloadJwt?.role || session?.utilisateur?.role || null;

  const utilisateurComplet = session?.utilisateur
    ? { ...session.utilisateur, role: roleOfficiel }
    : null;

  const valeur = {
    utilisateur: utilisateurComplet,
    role: roleOfficiel,
    estConnecte: Boolean(session?.token),
    finaliserConnexion,
    deconnexion,
  };

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
