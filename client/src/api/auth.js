import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const register = (payload) => axios.post(`${API_BASE}/auth/register`, payload);
export const login = (payload) => axios.post(`${API_BASE}/auth/login`, payload);
export const getProfile = () => axios.get(`${API_BASE}/auth/profile`);
export const updateHandles = (payload) => axios.put(`${API_BASE}/user/handles`, payload);
