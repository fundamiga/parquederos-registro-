import { useState } from 'react';
import { crearMoto, actualizarMoto } from '../services/motosService';
import { crearAbono } from '../services/abonosService';
import { registrarEntrada } from '../services/parqueaderoService';
import { format, addDays, addMonths } from 'date-fns';

const PRECIOS_DEFAULT = {
  diario: 700,
  semanal: 3500,
  quincenal: 7000,
  mensual: 14000,
};

export default function ModalRegistroRapido({ placaInicial, motoInicial, planPorDefecto = 'diario', onClose, onMotoCreada, onMotoActualizada }) {
  const esEdicion = Boolean(motoInicial);

  const [placa, setPlaca] = useState(motoInicial?.placa || placaInicial || '');
  const [propietario, setPropietario] = useState(motoInicial?.propietario || '');
  const [telefono, setTelefono] = useState(motoInicial?.telefono || '');
  const [marca, setMarca] = useState(motoInicial?.marca || '');
  const [modelo, setModelo] = useState(motoInicial?.modelo || '');
  
  // Opción para asignar plan inicial (diario, semanal, quincenal o mensual)
  const [asignarPlan, setAsignarPlan] = useState(!esEdicion);
  const [tipoPlan, setTipoPlan] = useState(motoInicial?.modalidad_pago || planPorDefecto || 'diario');
  const [monto, setMonto] = useState(String(PRECIOS_DEFAULT[planPorDefecto] || 700));
  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(false);

  const seleccionarPlan = (tipo) => {
    setTipoPlan(tipo);
    setMonto(String(PRECIOS_DEFAULT[tipo] || 700));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!placa.trim() || !propietario.trim()) {
      return alert('La Placa y el Nombre del Trabajador/Propietario son obligatorios');
    }
    if (asignarPlan && (!monto || Number(monto) < 0)) {
      return alert('Ingresa un monto de tarifa válido');
    }

    setCargando(true);
    try {
      if (esEdicion) {
        // 1. Actualizar moto existente
        const respMoto = await actualizarMoto(motoInicial.id, {
          placa: placa.toUpperCase().trim(),
          propietario: propietario.trim(),
          telefono: telefono.trim(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          modalidad_pago: tipoPlan,
        });
        if (onMotoActualizada) onMotoActualizada(respMoto.data);
      } else {
        // 2. Crear nueva moto con nombre y modalidad
        const respMoto = await crearMoto({
          placa: placa.toUpperCase().trim(),
          propietario: propietario.trim(),
          telefono: telefono.trim(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          modalidad_pago: tipoPlan,
        });

        const nuevaMoto = respMoto.data;
        const montoCobrado = Number(monto);

        // 3. Asignar el plan seleccionado con el precio editable/excepcional
        if (asignarPlan && nuevaMoto?.id) {
          if (tipoPlan === 'diario') {
            // Registrar entrada con cobro personalizado
            await registrarEntrada({
              moto_id: nuevaMoto.id,
              placa: nuevaMoto.placa,
              tipo_ingreso: 'dia',
              cobro_extra: montoCobrado,
            });
          } else {
            const hoy = new Date();
            const fechaInicio = format(hoy, 'yyyy-MM-dd');
            let fechaFin;

            if (tipoPlan === 'semanal') {
              fechaFin = format(addDays(hoy, 7), 'yyyy-MM-dd');
            } else if (tipoPlan === 'quincenal') {
              fechaFin = format(addDays(hoy, 15), 'yyyy-MM-dd');
            } else {
              fechaFin = format(addMonths(hoy, 1), 'yyyy-MM-dd');
            }

            await crearAbono({
              moto_id: nuevaMoto.id,
              tipo: tipoPlan,
              fecha_inicio: fechaInicio,
              fecha_fin: fechaFin,
              monto: montoCobrado,
              observaciones: observaciones.trim() || null,
            });
          }
        }

        if (onMotoCreada) onMotoCreada(placa.toUpperCase().trim());
      }

      onClose();
    } catch (err) {
      alert('Error al guardar datos: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="card-glass w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 h-9 w-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-2xl shadow-sm">
            {esEdicion ? '✏️' : '👤'}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
              {esEdicion ? 'Editar Trabajador y Moto' : 'Registrar Trabajador y Moto'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {esEdicion ? 'Actualiza los datos de contacto y vehículo' : 'Ingresa el nombre y define su tarifa personalizada'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          
          {/* Placa Badge & Input */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Placa de la Moto *
            </label>
            <input
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="SGV40F"
              maxLength={6}
              className="input font-mono text-2xl font-black tracking-[0.25em] text-center border-2 border-emerald-500/80 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-yellow-300 py-3"
              required
            />
          </div>

          {/* Propietario / Trabajador */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Nombre Completo del Trabajador / Conductor *
            </label>
            <input
              value={propietario}
              onChange={(e) => setPropietario(e.target.value)}
              placeholder="Ej: Carlos Mendoza"
              className="input py-3 font-bold text-sm"
              required
              autoFocus
            />
          </div>

          {/* Teléfono & Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Teléfono / WhatsApp (Opcional)
              </label>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 3146801813"
                className="input py-3 font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Marca de la Moto (Opcional)
              </label>
              <input
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ej: Yamaha, Suzuki, AKT"
                className="input py-3 font-medium"
              />
            </div>
          </div>

          {/* Modelo */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Modelo / Línea (Opcional)
            </label>
            <input
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              placeholder="Ej: NMAX 155 / 2024"
              className="input py-3 font-medium"
            />
          </div>

          {/* Asignar Plan y Tarifa Personalizada */}
          <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mt-1 flex flex-col gap-3">
            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Selecciona la Modalidad de Pago del Trabajador:
            </span>

            {/* 4 Botones de Selección */}
            <div className="grid grid-cols-2 gap-2">
              
              {/* Opción 1: Diario */}
              <button
                type="button"
                onClick={() => seleccionarPlan('diario')}
                className={`py-2.5 px-2 rounded-2xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  tipoPlan === 'diario'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-yellow-300 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>🟡 Pago Diario</span>
                <span className="text-xs font-black text-amber-700 dark:text-yellow-400">$700 COP</span>
              </button>

              {/* Opción 2: Semanal */}
              <button
                type="button"
                onClick={() => seleccionarPlan('semanal')}
                className={`py-2.5 px-2 rounded-2xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  tipoPlan === 'semanal'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 ring-2 ring-purple-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>🟣 Semanal (7d)</span>
                <span className="text-xs font-black text-purple-600 dark:text-purple-400">$3.500 COP</span>
              </button>

              {/* Opción 3: Quincenal */}
              <button
                type="button"
                onClick={() => seleccionarPlan('quincenal')}
                className={`py-2.5 px-2 rounded-2xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  tipoPlan === 'quincenal'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>🗓️ Quincena (15d)</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">$7.000 COP</span>
              </button>

              {/* Opción 4: Mensual */}
              <button
                type="button"
                onClick={() => seleccionarPlan('mensual')}
                className={`py-2.5 px-2 rounded-2xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  tipoPlan === 'mensual'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>📅 Mes (30d)</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">$14.000 COP</span>
              </button>

            </div>

            {/* PRECIO EDITABLE PARA CASOS EXCEPCIONALES */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  💰 Tarifa a Cobrar ($ COP) — Modificable:
                </label>
                <span className="text-[10px] text-amber-600 dark:text-yellow-400 font-bold">
                  ✏️ Modifica si hay excepción
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="7000"
                  className="input pl-9 font-mono text-xl font-black text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 border-2 border-emerald-500/50"
                  required
                />
              </div>
            </div>

            {/* NOTA / MOTIVO DE EXCEPCIÓN */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Nota de Excepción (Opcional):
              </label>
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Descuento autorizado por administración"
                className="input py-2 text-xs"
              />
            </div>

          </div>

          {/* Submit */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-3.5 text-xs sm:text-sm font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="btn-primary flex-1 py-3.5 text-xs sm:text-sm font-black shadow-lg"
            >
              <span>💾</span> {cargando ? 'Guardando...' : (esEdicion ? 'Guardar Cambios' : 'Guardar y Registrar Ingreso')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}