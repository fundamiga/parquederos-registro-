import api from './api';

export const buscarPlaca = (placa) => api.post('/placas/buscar', { placa });
export const detectarPlacaIA = (imagenBase64) => api.post('/placas/detectar-ia', { imagenBase64 });