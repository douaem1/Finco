import api from './api';

/* Appels HTTP pour la gestion des budgets CO. */

export async function listerBudgets() {
  const { data } = await api.get('/budgets');
  return data;
}

export async function listerBudgetsCentre(centreCoutId) {
  const { data } = await api.get(`/budgets/centre/${centreCoutId}`);
  return data;
}

export async function obtenirBudget(id) {
  const { data } = await api.get(`/budgets/${id}`);
  return data;
}

export async function creerBudget(budget) {
  const { data } = await api.post('/budgets', budget);
  return data;
}

export async function modifierBudget(id, budget) {
  const { data } = await api.put(`/budgets/${id}`, budget);
  return data;
}

export async function supprimerBudget(id) {
  await api.delete(`/budgets/${id}`);
}
