import api from './api';

export async function listerImputations(periode) {
  const { data } = await api.get('/imputations', { params: periode ? { periode } : {} });
  return data;
}

export async function calculerImputations(periode) {
  const { data } = await api.post('/imputations', { periode });
  return data;
}

export async function obtenirRapportAnalytique(annee) {
  const { data } = await api.get('/rapports/analytique', { params: { annee } });
  return data;
}
