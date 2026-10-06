import { createContext, useContext, useState } from 'react';
import { CLE_SESSION, lireSession } from '../services/api';
import { verifierCode } from '../services/authApi';

/* ============================================================
   Contexte d'authentification : partage l'utilisateur connecté
   avec toutes les pages, sans passer de props à chaque niveau.
   La session (jeton + utilisateur) est gardée dans localStorage
   pour survivre à un rafraîchissement de la page.
   Elle n'est créée qu'APRÈS la vérification du code OTP.
   ============================================================ */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => lireSession());

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

  const valeur = {
    utilisateur: session?.utilisateur ?? null,
    estConnecte: Boolean(session?.token),
    finaliserConnexion,
    deconnexion,
  };

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
