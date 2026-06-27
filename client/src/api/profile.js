import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const getPublicProfile = (username) => axios.get(`${API_BASE}/profile/${username}`);
