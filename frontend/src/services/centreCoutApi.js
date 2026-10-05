import api from './api';

/* Tous les appels HTTP des centres de coûts (module CO). */

export async function listerCentres() {
  const { data } = await api.get('/centres-cout');
  return data;
}

export async function obtenirCentre(id) {
  const { data } = await api.get(`/centres-cout/${id}`);
  return data;
}

export async function creerCentre(centre) {
  const { data } = await api.post('/centres-cout', centre);
  return data;
}

export async function modifierCentre(id, centre) {
  const { data } = await api.put(`/centres-cout/${id}`, centre);
  return data;
}

export async function supprimerCentre(id) {
  await api.delete(`/centres-cout/${id}`);
}
