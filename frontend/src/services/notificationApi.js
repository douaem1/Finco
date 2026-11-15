import api from './api';

/* Notifications de l'utilisateur connecté. On réutilise l'instance axios unique. */

export async function listerNotifications({ page = 0, size = 20, nonLuesSeulement = false } = {}) {
  const { data } = await api.get('/notifications', { params: { page, size, nonLuesSeulement } });
  return data;
}

export async function compterNotificationsNonLues() {
  const { data } = await api.get('/notifications/non-lues/count');
  return data.count;
}

export async function marquerNotificationLue(id) {
  await api.patch(`/notifications/${id}/lue`);
}

export async function toutMarquerNotificationsLues() {
  await api.patch('/notifications/tout-lire');
}
