import api from './client.js';

export const getRecommendations = () => api.get('/recommendations');
