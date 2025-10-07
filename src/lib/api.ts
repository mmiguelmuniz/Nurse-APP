import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL as string;

const api = axios.create({ baseURL: API_URL });

// Anexa Authorization: Bearer <access> se existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Se o token expirar, “desloga”
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      window.location.href = '/';
    }
    return Promise.reject(err),"not found";
  }
);

export default api;
