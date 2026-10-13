import api from './api';

/* Appels HTTP pour la gestion des tiers (Fournisseurs & Clients). */

export async function listerFournisseurs() {
  const { data } = await api.get('/fournisseurs');
  return data;
}

export async function obtenirFournisseur(id) {
  const { data } = await api.get(`/fournisseurs/${id}`);
  return data;
}

export async function creerFournisseur(fournisseur) {
  const { data } = await api.post('/fournisseurs', fournisseur);
  return data;
}

export async function modifierFournisseur(id, fournisseur) {
  const { data } = await api.put(`/fournisseurs/${id}`, fournisseur);
  return data;
}

export async function supprimerFournisseur(id) {
  await api.delete(`/fournisseurs/${id}`);
}

export async function listerClients() {
  const { data } = await api.get('/clients');
  return data;
}

export async function obtenirClient(id) {
  const { data } = await api.get(`/clients/${id}`);
  return data;
}

export async function creerClient(client) {
  const { data } = await api.post('/clients', client);
  return data;
}

export async function modifierClient(id, client) {
  const { data } = await api.put(`/clients/${id}`, client);
  return data;
}

export async function supprimerClient(id) {
  await api.delete(`/clients/${id}`);
}
