import api from './api';

/** Étape 1 — POST /api/auth/login -> { jetonOtp, emailMasque, validiteSecondes, renvoiDansSecondes } */
export async function demanderCode(email, motDePasse) {
  const { data } = await api.post('/auth/login', { email, motDePasse });
  return data;
}

/** Étape 2 — POST /api/auth/verifier-otp -> { token, utilisateur } */
export async function verifierCode(jetonOtp, code) {
  const { data } = await api.post('/auth/verifier-otp', { jetonOtp, code });
  return data;
}

/** POST /api/auth/renvoyer-otp -> nouvelles infos du code */
export async function renvoyerCode(jetonOtp) {
  const { data } = await api.post('/auth/renvoyer-otp', { jetonOtp });
  return data;
}

/** GET /api/auth/me -> utilisateur connecté */
export async function profil() {
  const { data } = await api.get('/auth/me');
  return data;
}
