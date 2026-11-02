import api from './api';

export async function listerPaiements() {
  const { data } = await api.get('/paiements');
  return data;
}

export async function validerPaiement(id) {
  const { data } = await api.put(`/paiements/${id}/valider`);
  return data;
}
