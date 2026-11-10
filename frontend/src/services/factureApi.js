import api from './api';

export async function listerFactures() {
  const { data } = await api.get('/factures');
  return data;
}

export async function creerFacture(facture) {
  const { data } = await api.post('/factures', facture);
  return data;
}

export async function modifierFacture(id, facture) {
  const { data } = await api.put(`/factures/${id}`, facture);
  return data;
}

export async function validerFacture(id, donnees) {
  const { data } = await api.patch(`/factures/${id}/valider`, donnees);
  return data;
}

export async function supprimerFacture(id) {
  await api.delete(`/factures/${id}`);
}
