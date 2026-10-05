import api from './api';

/* Tous les appels HTTP liés aux écritures comptables. */

export async function listerPieces() {
  const { data } = await api.get('/pieces');
  return data;
}

export async function obtenirPiece(id) {
  const { data } = await api.get(`/pieces/${id}`);
  return data;
}

/** piece = { dateEcriture, libelle, lignes: [{ compteId, centreCoutId, sens, montant }] } */
export async function saisirPiece(piece) {
  const { data } = await api.post('/pieces', piece);
  return data;
}

export async function listerComptes() {
  const { data } = await api.get('/comptes');
  return data;
}
