import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  return config;
});

export const register = (payload) => api.post('/auth/register', payload);
export const login = (payload) => api.post('/auth/login', payload);
export const getProfile = () => api.get('/auth/profile');
export const logout = () => api.post('/auth/logout');
export const getDashboardStats = () => api.get('/user/dashboard');
export const updateHandles = (payload) => api.put('/user/handles', payload);
