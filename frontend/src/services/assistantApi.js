import api from './api';

export async function demanderReponseAssistant(messages) {
  const { data } = await api.post('/assistant/chat', { messages });
  return data.reponse;
}
