import axios from 'axios';

/* ============================================================
   Client HTTP unique de l'application.
   - baseURL : adresse du backend Spring (port 8081)
   - intercepteur de requête : ajoute « Authorization: Bearer <jeton> »
   - intercepteur de réponse : si le serveur répond 401 (jeton absent
     ou expiré), on efface la session et on renvoie vers /login
   ============================================================ */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';
export const CLE_SESSION = 'finco.session';

const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use((config) => {
  const session = lireSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    const statut = erreur.response?.status;
    const estLogin = erreur.config?.url?.includes('/auth/login');
    if (statut === 401 && !estLogin) {
      localStorage.removeItem(CLE_SESSION);
      window.location.assign('/login?expire=1');
    }
    return Promise.reject(erreur);
  },
);

export function lireSession() {
  try {
    return JSON.parse(localStorage.getItem(CLE_SESSION));
  } catch {
    return null;
  }
}

/**
 * Message à afficher à l'utilisateur : celui renvoyé par le serveur
 * ({ "message": "..." }). React n'invente aucun message métier.
 */
export function messageErreur(erreur) {
  if (erreur.response?.data?.message) return erreur.response.data.message;
  if (erreur.request && !erreur.response) return 'Serveur injoignable : vérifiez que le backend est démarré.';
  return 'Une erreur inattendue est survenue.';
}

export default api;
