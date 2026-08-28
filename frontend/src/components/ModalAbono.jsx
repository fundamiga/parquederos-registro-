import { useState } from 'react';
import { format, addDays, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { crearAbono } from '../services/abonosService';

export default function ModalAbono({ moto, onClose, onCreado }) {
  const [tipo, setTipo] = useState('quincenal');
  const [monto, setMonto] = useState('7000');
  const [estadoPago, setEstadoPago] = useState('al_vencer'); // 'adelantado' o 'al_vencer'
  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(false);

  const ahora = new Date();
  const horaActual = format(ahora, 'hh:mm a', { locale: es });
  const fechaActual = format(ahora, 'dd/MM/yyyy');
  const fechaInicio = format(ahora, 'yyyy-MM-dd');
  const fechaFin = format(tipo === 'mensual' ? addMonths(ahora, 1) : addDays(ahora, 15), 'yyyy-MM-dd');
  const fechaFinDisplay = format(tipo === 'mensual' ? addMonths(ahora, 1) : addDays(ahora, 15), "dd 'de' MMMM yyyy", { locale: es });
  const dias = tipo === 'mensual' ? 30 : 15;

  const setPreset = (t, val) => {
    setTipo(t);
    setMonto(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) return alert('Ingresa un monto de tarifa válido');
    setCargando(true);
    try {
      await crearAbono({
        moto_id: moto.id,
        tipo,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        monto: Number(monto),
        estado_pago: estadoPago,
        observaciones: observaciones.trim() || null,
      });
      onCreado();
      onClose();
    } catch (err) {
      alert('Error al activar período: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="card-glass w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 h-9 w-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-2xl shadow-sm">
            🗓️
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
              Activar Plan Quincenal / Mensual
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Inicia el conteo de días desde hoy
            </p>
          </div>
        </div>

        {/* Moto Info */}
        <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PROPIETARIO</span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block">{moto.propietario}</span>
            {moto.telefono && <span className="text-xs text-slate-500 dark:text-slate-400 block">{moto.telefono}</span>}
          </div>
          <span className="placa-colombiana font-mono text-sm px-3 py-1 rounded-xl font-black">
            {moto.placa}
          </span>
        </div>

        {/* Registro de Hora Exacta de Inicio */}
        <div className="bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-500/40 rounded-2xl p-3 mb-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">🕐</span>
            <div>
              <span className="font-bold text-sky-900 dark:text-sky-200 block">Inicio del Período (Día 1)</span>
              <span className="text-sky-700 dark:text-sky-400 font-semibold">{fechaActual} — {horaActual}</span>
            </div>
          </div>
          <span className="badge badge-info text-[9px]">Automático</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Tipo de Período */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">
              1. Selecciona la Duración
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPreset('quincenal', '7000')}
                className={`py-3 px-3 rounded-2xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  tipo === 'quincenal'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20 dark:ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>🗓️ Quincena (15 días)</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">$7.000 COP</span>
              </button>

              <button
                type="button"
                onClick={() => setPreset('mensual', '14000')}
                className={`py-3 px-3 rounded-2xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  tipo === 'mensual'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20 dark:ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>📅 Mes (30 días)</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">$14.000 COP</span>
              </button>
            </div>
          </div>

          {/* Modalidad de Pago (Adelantado vs Al Vencer) */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">
              2. ¿Cuándo Cancela el Dinero?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setEstadoPago('al_vencer')}
                className={`py-2.5 px-3 rounded-2xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  estadoPago === 'al_vencer'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-yellow-300 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>🟡 Paga al Vencer</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Al cumplir los {dias} días</span>
              </button>

              <button
                type="button"
                onClick={() => setEstadoPago('adelantado')}
                className={`py-2.5 px-3 rounded-2xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  estadoPago === 'adelantado'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>🟢 Pagó Adelantado</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Cancela hoy mismo</span>
              </button>
            </div>
          </div>

          {/* Resumen de Vigencia */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Inicia</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm block">{fechaActual}</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">{horaActual}</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <span className="text-emerald-600 dark:text-emerald-400 font-black text-xl">→</span>
                  <span className="badge badge-success text-[9px] font-bold">{dias} días</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  {estadoPago === 'adelantado' ? 'Vence el' : 'Cobrar el'}
                </span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm block">{fechaFinDisplay}</span>
              </div>
            </div>
          </div>

          {/* Tarifa */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Valor de la Tarifa ($ COP)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="7000"
                className="input pl-9 font-mono text-lg font-black text-emerald-600 dark:text-emerald-400"
                required
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Observaciones / Notas (Opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Acordado con el propietario"
              rows={2}
              className="input text-xs resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-3.5 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="btn-primary flex-1 py-3.5 text-sm font-black shadow-md"
            >
              <span>🚀</span> {cargando ? 'Iniciando...' : 'Iniciar Conteo de Días'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}