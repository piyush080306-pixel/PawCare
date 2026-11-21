import axios from 'axios';

const configured = String(import.meta.env.VITE_API_BASE_URL ?? '').trim();
export const API_BASE_URL = (configured || 'http://localhost:8080/api').replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12_000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    const message =
      data?.error ??
      data?.message ??
      (error.code === 'ECONNABORTED'
        ? 'The shelter API did not respond in time.'
        : error.response
          ? `Request failed (HTTP ${error.response.status}).`
          : 'Cannot reach the Scala API at http://localhost:8080.');
    return Promise.reject(new Error(message));
  },
);
