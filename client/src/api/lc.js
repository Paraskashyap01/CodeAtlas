import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const getLCStats = () => axios.get(`${API_BASE}/lc/stats`);
export const getLCProfile = () => axios.get(`${API_BASE}/lc/profile`);
