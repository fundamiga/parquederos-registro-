import api from './api';
export const listarMotos = (search) => api.get('/motos', { params: { search } });
export const obtenerMoto = (id) => api.get(`/motos/${id}`);
export const crearMoto = (data) => api.post('/motos', data);
export const actualizarMoto = (id, data) => api.put(`/motos/${id}`, data);
export const eliminarMoto = (id) => api.delete(`/motos/${id}`);