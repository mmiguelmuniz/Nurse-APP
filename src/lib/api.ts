import axios from 'axios';

export const API_URL =
  (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // útil se você decidir usar cookies httpOnly no futuro
  timeout: 20000,
});

// Anexa Authorization: Bearer <access> se existir
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('access');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Se o token expirar, “desloga”
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem('access');
      window.localStorage.removeItem('refresh');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);


export default api;
