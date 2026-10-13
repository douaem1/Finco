import api from './api';

/* Appels HTTP pour le plan comptable (CompteGeneral). */

export async function listerComptes() {
  const { data } = await api.get('/comptes');
  return data;
}

export async function obtenirCompte(id) {
  const { data } = await api.get(`/comptes/${id}`);
  return data;
}

export async function creerCompte(compte) {
  const { data } = await api.post('/comptes', compte);
  return data;
}

export async function modifierCompte(id, compte) {
  const { data } = await api.put(`/comptes/${id}`, compte);
  return data;
}

export async function supprimerCompte(id) {
  await api.delete(`/comptes/${id}`);
}
