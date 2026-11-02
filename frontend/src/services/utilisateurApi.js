import api from './api';

export async function listerUtilisateurs() {
  const { data } = await api.get('/utilisateurs');
  return data;
}

export async function creerUtilisateur(utilisateur) {
  const { data } = await api.post('/utilisateurs', utilisateur);
  return data;
}

export async function modifierUtilisateur(id, utilisateur) {
  const { data } = await api.put(`/utilisateurs/${id}`, utilisateur);
  return data;
}

export async function supprimerUtilisateur(id) {
  await api.delete(`/utilisateurs/${id}`);
}
