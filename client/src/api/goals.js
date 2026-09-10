import api from './client.js';

export const getGoal = () => api.get('/goals');
export const saveGoal = (payload) => api.post('/goals', payload);
