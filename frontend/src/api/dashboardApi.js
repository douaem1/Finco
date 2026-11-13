import api from '../services/api';

const ENDPOINTS = {
  COMPTABLE: '/dashboard/comptable',
  CONTROLEUR: '/dashboard/controleur',
  DIRECTEUR_FINANCIER: '/dashboard/directeur',
  ADMIN: '/dashboard/admin',
};

export async function chargerDashboard(role, filtres = {}) {
  const endpoint = ENDPOINTS[role];
  if (!endpoint) throw new Error('Rôle de tableau de bord inconnu.');
  const { data } = await api.get(endpoint, { params: Object.fromEntries(
    Object.entries(filtres).filter(([, value]) => value !== '' && value != null),
  ) });
  return data;
}