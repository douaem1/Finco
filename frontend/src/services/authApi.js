import api from './api';

/** POST /api/auth/login -> { token, utilisateur } */
export async function seConnecter(login, motDePasse) {
  const { data } = await api.post('/auth/login', { login, motDePasse });
  return data;
}

/** GET /api/auth/me -> utilisateur connecté */
export async function profil() {
  const { data } = await api.get('/auth/me');
  return data;
}
