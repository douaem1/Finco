import api from './api';

export async function listerPaiements() {
  const { data } = await api.get('/paiements');
  return data;
}

export async function validerPaiement(id) {
  const { data } = await api.put(`/paiements/${id}/valider`);
  return data;
}

export async function rejeterPaiement(id, motif) {
  const { data } = await api.patch(`/paiements/${id}/rejeter`, { motif });
  return data;
}

export async function enregistrerPaiement(paiement) {
  const { data } = await api.post('/paiements', paiement);
  return data;
}
