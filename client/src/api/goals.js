import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const getGoal = () => axios.get(`${API_BASE}/goals`);
export const saveGoal = (payload) => axios.post(`${API_BASE}/goals`, payload);
export const updateGoal = (id, payload) => axios.patch(`${API_BASE}/goals/${id}`, payload);
