import api from './client.js';

export const getPublicProfile = (username) => api.get(`/profile/${username}`);
