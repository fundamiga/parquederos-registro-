import api from './api';

export const getActivos = () => api.get('/parqueadero/activos');
export const getHistorial = (fecha) => api.get('/parqueadero/historial', { params: { fecha } });
export const getDashboard = () => api.get('/parqueadero/dashboard');
export const getInformeDiario = (fecha) => api.get('/parqueadero/informe-diario', { params: { fecha } });
export const registrarEntrada = (data) => {
  // data puede ser { moto_id, tipo_ingreso } o solo moto_id
  const payload = typeof data === 'string' ? { moto_id: data, tipo_ingreso: 'abono' } : data;
  return api.post('/parqueadero/entrada', payload);
};
export const registrarSalida = (entrada_id, cobro_extra) => api.post('/parqueadero/salida', { entrada_id, cobro_extra });