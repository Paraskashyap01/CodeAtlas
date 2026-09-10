import api from './client.js';

export const getCFStats = () => api.get('/cf/stats');
