import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const getNotes = () => axios.get(`${API_BASE}/notes`);
export const createNote = (payload) => axios.post(`${API_BASE}/notes`, payload);
