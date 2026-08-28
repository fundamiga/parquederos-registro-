import api from './api';
export const login = (email, password) => api.post('/auth/login', { email, password });
export const registro = (nombre, email, password) => api.post('/auth/registro', { nombre, email, password });
