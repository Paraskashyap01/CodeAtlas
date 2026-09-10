import api from './client.js';

export const register = (payload) => api.post('/auth/register', payload);
export const login = (payload) => api.post('/auth/login', payload);
export const getProfile = () => api.get('/user/profile');
export const logout = () => api.post('/auth/logout');
export const getDashboardStats = () => api.get('/user/dashboard');
export const updateHandles = (payload) => api.put('/user/handles', payload);
