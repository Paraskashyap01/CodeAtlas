import api from './client.js';

export const getLCStats = () => api.get('/lc/stats');
