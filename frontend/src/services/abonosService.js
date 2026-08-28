import api from './api';
export const listarAbonos = (moto_id) => api.get('/abonos', { params: { moto_id } });
export const crearAbono = (data) => api.post('/abonos', data);
export const actualizarAbono = (id, data) => api.put(`/abonos/${id}`, data);
export const verificarVigente = (moto_id) => api.get(`/abonos/vigente/${moto_id}`);
export const eliminarAbono = (id) => api.delete(`/abonos/${id}`);