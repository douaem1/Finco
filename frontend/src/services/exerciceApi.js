import api from './api';

/* Appels HTTP pour la gestion des exercices comptables. */

export async function listerExercices() {
  const { data } = await api.get('/exercices');
  return data;
}

export async function obtenirExercice(id) {
  const { data } = await api.get(`/exercices/${id}`);
  return data;
}

export async function creerExercice(exercice) {
  const { data } = await api.post('/exercices', exercice);
  return data;
}

export async function modifierExercice(id, exercice) {
  const { data } = await api.put(`/exercices/${id}`, exercice);
  return data;
}

export async function cloturerExercice(id) {
  const { data } = await api.patch(`/exercices/${id}/cloturer`);
  return data;
}

export async function supprimerExercice(id) {
  await api.delete(`/exercices/${id}`);
}
