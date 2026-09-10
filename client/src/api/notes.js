import api from './client.js';

export const getNotes = () => api.get('/notes');
export const createNote = (payload) => api.post('/notes', payload);
