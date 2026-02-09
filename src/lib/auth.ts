import { API_URL } from './api';

export function loginWithGoogle() {
  window.location.href = `${API_URL}/auth/google`;
}

export function captureTokensFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const access = params.get('access');
  const refresh = params.get('refresh');
  if (access) localStorage.setItem('access', access);
  if (refresh) localStorage.setItem('refresh', refresh);
  if (access || refresh) {
    // remove os query params sem recarregar a página
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem('access');
}

export function logout() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  window.location.href = '/';
}
