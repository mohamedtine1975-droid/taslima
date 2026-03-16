import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Inject JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taslima_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('taslima_token');
      localStorage.removeItem('taslima_user');
      window.location.href = '/connexion';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  inscription: (data) => api.post('/auth/inscription', data),
  connexion: (data) => api.post('/auth/connexion', data),
  moi: () => api.get('/auth/moi'),
  modifier: (data) => api.put('/auth/modifier', data),
};

export const ticketsAPI = {
  creer: (data) => api.post('/tickets', data),
  file: () => api.get('/tickets/file'),
  suivi: (numero) => api.get('/tickets/suivi/' + numero),
  mesTickets: () => api.get('/tickets/mes-tickets'),
  tous: (params) => api.get('/tickets', { params }),
  changerStatut: (id, statut) => api.put('/tickets/' + id + '/statut', { statut }),
};

export const queueAPI = {
  stats: () => api.get('/queue/stats'),
  appellerSuivant: () => api.post('/queue/appeler-suivant'),
};

export default api;
