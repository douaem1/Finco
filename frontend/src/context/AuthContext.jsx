import { createContext, useContext, useState } from 'react';
import { CLE_SESSION, lireSession } from '../services/api';
import { seConnecter } from '../services/authApi';

/* ============================================================
   Contexte d'authentification : partage l'utilisateur connecté
   avec toutes les pages, sans passer de props à chaque niveau.
   La session (jeton + utilisateur) est gardée dans localStorage
   pour survivre à un rafraîchissement de la page.
   ============================================================ */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => lireSession());

  async function connexion(login, motDePasse) {
    const reponse = await seConnecter(login, motDePasse); // lève une erreur si 401
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
    connexion,
    deconnexion,
  };

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
