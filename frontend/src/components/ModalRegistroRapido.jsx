import { useState } from 'react';
import { crearMoto } from '../services/motosService';
import { crearAbono } from '../services/abonosService';
import { format, addDays, addMonths } from 'date-fns';

export default function ModalRegistroRapido({ placaInicial, onClose, onMotoCreada }) {
  const [placa, setPlaca] = useState(placaInicial || '');
  const [propietario, setPropietario] = useState('');
  const [telefono, setTelefono] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  
  // Opción para asignar abono de una vez
  const [asignarAbono, setAsignarAbono] = useState(true);
  const [tipoAbono, setTipoAbono] = useState('quincenal');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!placa.trim() || !propietario.trim()) {
      return alert('La Placa y el Nombre del Propietario son obligatorios');
    }

    setCargando(true);
    try {
      // 1. Crear la moto en Supabase
      const respMoto = await crearMoto({
        placa: placa.toUpperCase().trim(),
        propietario: propietario.trim(),
        telefono: telefono.trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
      });

      const nuevaMoto = respMoto.data;

      // 2. Si marcó asignar abono inicial
      if (asignarAbono && nuevaMoto?.id) {
        const hoy = new Date();
        const fechaInicio = format(hoy, 'yyyy-MM-dd');
        const fechaFin = format(tipoAbono === 'mensual' ? addMonths(hoy, 1) : addDays(hoy, 15), 'yyyy-MM-dd');
        const monto = tipoAbono === 'mensual' ? 14000 : 7000;

        await crearAbono({
          moto_id: nuevaMoto.id,
          tipo: tipoAbono,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          monto: monto,
        });
      }

      onMotoCreada(placa.toUpperCase().trim());
      onClose();
    } catch (err) {
      alert('Error al registrar moto: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="card-glass w-full max-w-lg bg-slate-900 border border-slate-700/80 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 h-9 w-9 rounded-full flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 transition-colors text-sm"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-800/80">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-lg">
            🏍️
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-100 leading-tight">
              Registrar Moto en el Sistema
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Fundación Funda Amiga — Registro Inmediato
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          
          {/* Placa Badge & Input */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Placa del Vehículo *
            </label>
            <input
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="SGV40F"
              maxLength={6}
              className="input font-mono text-2xl font-black tracking-[0.25em] text-center border-2 border-emerald-500/80 bg-slate-950 text-yellow-300 py-3"
              required
            />
          </div>

          {/* Propietario */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Nombre Completo del Propietario / Dueño *
            </label>
            <input
              value={propietario}
              onChange={(e) => setPropietario(e.target.value)}
              placeholder="Ej: Kevin Camilo Molina"
              className="input py-3"
              required
            />
          </div>

          {/* Teléfono & Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Teléfono / WhatsApp
              </label>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 3146801813"
                className="input py-3"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Marca de la Moto
              </label>
              <input
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ej: Yamaha, Suzuki, AKT"
                className="input py-3"
              />
            </div>
          </div>

          {/* Modelo */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Modelo / Línea
            </label>
            <input
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              placeholder="Ej: NMAX 155 / 2024"
              className="input py-3"
            />
          </div>

          {/* Asignar Abono Inicial */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 mt-1">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200 text-xs select-none">
                <input
                  type="checkbox"
                  checked={asignarAbono}
                  onChange={(e) => setAsignarAbono(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                />
                <span>Asignar y Cobrar Abono Inicial de una vez</span>
              </label>
            </div>

            {asignarAbono && (
              <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => setTipoAbono('quincenal')}
                  className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                    tipoAbono === 'quincenal'
                      ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300 ring-2 ring-emerald-500/30'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <span>🗓️ Quincena (15 días)</span>
                  <span className="text-emerald-400 font-black text-sm">$7.000 COP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoAbono('mensual')}
                  className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                    tipoAbono === 'mensual'
                      ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300 ring-2 ring-emerald-500/30'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <span>📅 Mes (30 días)</span>
                  <span className="text-emerald-400 font-black text-sm">$14.000 COP</span>
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-3.5 text-xs sm:text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="btn-primary flex-1 py-3.5 text-xs sm:text-sm font-black shadow-lg"
            >
              <span>💾</span> {cargando ? 'Guardando...' : 'Guardar y Continuar'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}