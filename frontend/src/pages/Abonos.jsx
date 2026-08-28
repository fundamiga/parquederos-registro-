import { useEffect, useState } from 'react';
import { listarAbonos, eliminarAbono, actualizarAbono } from '../services/abonosService';
import { listarMotos } from '../services/motosService';
import ModalAbono from '../components/ModalAbono';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

function HoraPago({ abono }) {
  const ts = abono.hora_pago || abono.created_at;
  if (!ts) return null;
  try {
    const d = new Date(ts);
    const fecha = format(d, "dd 'de' MMM yyyy", { locale: es });
    const hora = format(d, 'hh:mm a', { locale: es });
    return (
      <div className="flex items-center gap-2 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/30 rounded-xl px-3 py-2 mt-1">
        <span className="text-base">🕐</span>
        <div>
          <span className="text-[9px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider block">Hora de Registro</span>
          <span className="text-xs font-black text-sky-900 dark:text-sky-200">{fecha} — {hora}</span>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}

export default function Abonos() {
  const [abonos, setAbonos] = useState([]);
  const [motos, setMotos] = useState([]);
  const [motoSeleccionada, setMotoSeleccionada] = useState(null);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [abonoAEditar, setAbonoAEditar] = useState(null);
  const [filtroMoto, setFiltroMoto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [cargandoEdicion, setCargandoEdicion] = useState(false);

  // Formulario de edición de abono
  const [editForm, setEditForm] = useState({
    monto: '',
    tipo: 'quincenal',
    fecha_inicio: '',
    fecha_fin: '',
    observaciones: '',
  });

  const cargar = async () => {
    try {
      const [abRes, moRes] = await Promise.all([listarAbonos(), listarMotos()]);
      setAbonos(abRes.data || []);
      setMotos(moRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirEditarAbono = (abono) => {
    setAbonoAEditar(abono);
    setEditForm({
      monto: abono.monto || '',
      tipo: abono.tipo || 'quincenal',
      fecha_inicio: abono.fecha_inicio || '',
      fecha_fin: abono.fecha_fin || '',
      observaciones: abono.observaciones || '',
    });
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!abonoAEditar) return;
    if (!editForm.monto || Number(editForm.monto) < 0) return alert('Ingresa un monto válido');
    if (!editForm.fecha_inicio || !editForm.fecha_fin) return alert('Las fechas son obligatorias');

    setCargandoEdicion(true);
    try {
      await actualizarAbono(abonoAEditar.id, {
        monto: Number(editForm.monto),
        tipo: editForm.tipo,
        fecha_inicio: editForm.fecha_inicio,
        fecha_fin: editForm.fecha_fin,
        observaciones: editForm.observaciones.trim() || null,
      });
      setAbonoAEditar(null);
      cargar();
    } catch (err) {
      alert('Error al actualizar abono: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargandoEdicion(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro de abono?')) return;
    try {
      await eliminarAbono(id);
      cargar();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const abonosFiltrados = abonos.filter((a) => {
    if (filtroMoto && a.moto_id !== filtroMoto) return false;
    const vencido = isPast(new Date(a.fecha_fin + 'T23:59:59'));
    if (filtroEstado === 'vigentes' && vencido) return false;
    if (filtroEstado === 'vencidos' && !vencido) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 md:pb-10 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-success text-[10px] sm:text-xs font-black">
              💳 Pagos & Suscripciones
            </span>
            <span className="text-xs text-slate-400 font-medium">Fundación Funda Amiga</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Pagos y Abonos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Control y edición de quincenas ($7.000), mensualidades ($14.000) y tarifas excepcionales.
          </p>
        </div>

        <button
          onClick={() => setShowSelectModal(true)}
          className="btn-primary py-3.5 px-6 text-sm font-black shadow-lg"
        >
          <span>➕</span> Nuevo Abono
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 card p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <select
          value={filtroMoto}
          onChange={(e) => setFiltroMoto(e.target.value)}
          className="input text-xs font-bold"
        >
          <option value="">Todas las motos ({motos.length})</option>
          {motos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.placa} — {m.propietario}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          {['todos', 'vigentes', 'vencidos'].map((est) => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black capitalize transition-all ${
                filtroEstado === est
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {est}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Grid */}
      {abonosFiltrados.length === 0 ? (
        <div className="card text-center py-16 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl text-slate-400">
            💳
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">No hay abonos encontrados</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Registra una suscripción mensual o quincenal para permitir acceso sin cobro extra.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {abonosFiltrados.map((a) => {
            const vencido = isPast(new Date(a.fecha_fin + 'T23:59:59'));
            return (
              <div
                key={a.id}
                className={`card p-5 flex flex-col justify-between gap-4 border shadow-sm ${
                  vencido
                    ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/15'
                    : 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/15'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="placa-colombiana font-mono text-lg px-3 py-1 rounded-xl font-black shadow-xs">
                      {a.motos?.placa}
                    </span>
                    <span className={`badge text-[10px] font-black ${vencido ? 'badge-danger' : 'badge-success'}`}>
                      {vencido ? 'VENCIDO' : 'VIGENTE'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirEditarAbono(a)}
                      className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                      title="Editar monto, fechas o notas de este abono"
                    >
                      <span>✏️</span> Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(a.id)}
                      className="text-slate-400 hover:text-rose-500 text-xs p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Eliminar abono"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">Propietario:</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block truncate">{a.motos?.propietario}</span>
                  </div>

                  <div className="bg-white dark:bg-slate-950/70 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between mt-1">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PERÍODO</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 capitalize">{a.tipo}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MONTO COBRADO</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm font-mono">${a.monto?.toLocaleString()} COP</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 dark:text-slate-400">
                    <span>Desde: {format(parseISO(a.fecha_inicio), 'dd MMM yyyy', { locale: es })}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Vence: {format(parseISO(a.fecha_fin), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>

                  {/* Hora exacta de pago */}
                  <HoraPago abono={a} />

                  {/* Observaciones / Notas */}
                  {a.observaciones && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl px-3 py-2 mt-1">
                      <span className="text-[9px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">📝 Nota / Caso Especial</span>
                      <span className="text-xs text-amber-900 dark:text-amber-200 font-medium">{a.observaciones}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL EDITAR COBRO / TARIFA DE ABONO (CASOS EXCEPCIONALES) */}
      {abonoAEditar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="card-glass w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setAbonoAEditar(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 h-9 w-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="h-11 w-11 rounded-2xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-2xl shadow-sm">
                ✏️
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Editar Tarifa / Caso Excepcional
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {abonoAEditar.motos?.placa} — {abonoAEditar.motos?.propietario}
                </p>
              </div>
            </div>

            <form onSubmit={handleGuardarEdicion} className="flex flex-col gap-4 text-xs">
              
              {/* Monto Cobrado Editable */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Monto de la Tarifa ($ COP) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
                  <input
                    type="number"
                    value={editForm.monto}
                    onChange={(e) => setEditForm((f) => ({ ...f, monto: e.target.value }))}
                    placeholder="7000"
                    className="input pl-9 font-mono text-xl font-black text-emerald-600 dark:text-emerald-400"
                    required
                  />
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setEditForm((f) => ({ ...f, monto: '7000', tipo: 'quincenal' }))}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300"
                  >
                    Quincena ($7.000)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm((f) => ({ ...f, monto: '14000', tipo: 'mensual' }))}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300"
                  >
                    Mes ($14.000)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm((f) => ({ ...f, monto: '3500' }))}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300"
                  >
                    Mitad ($3.500)
                  </button>
                </div>
              </div>

              {/* Tipo de Período */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Tipo de Plan
                </label>
                <select
                  value={editForm.tipo}
                  onChange={(e) => setEditForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="input font-bold"
                >
                  <option value="quincenal">🗓️ Quincenal (15 días)</option>
                  <option value="mensual">📅 Mensual (30 días)</option>
                </select>
              </div>

              {/* Fechas de Inicio y Fin */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={editForm.fecha_inicio}
                    onChange={(e) => setEditForm((f) => ({ ...f, fecha_inicio: e.target.value }))}
                    className="input font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Fecha de Vence *
                  </label>
                  <input
                    type="date"
                    value={editForm.fecha_fin}
                    onChange={(e) => setEditForm((f) => ({ ...f, fecha_fin: e.target.value }))}
                    className="input font-bold"
                    required
                  />
                </div>
              </div>

              {/* Motivo o Nota del Caso Excepcional */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Nota / Motivo del Caso Excepcional
                </label>
                <textarea
                  value={editForm.observaciones}
                  onChange={(e) => setEditForm((f) => ({ ...f, observaciones: e.target.value }))}
                  placeholder="Ej: Descuento autorizado por administración / Trabajador inició a mitad de quincena"
                  rows={3}
                  className="input resize-none text-xs"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAbonoAEditar(null)}
                  className="btn-secondary flex-1 py-3.5 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargandoEdicion}
                  className="btn-primary flex-1 py-3.5 text-xs font-black shadow-lg"
                >
                  <span>💾</span> {cargandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Select Moto for New Abono Modal */}
      {showSelectModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="card-glass w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowSelectModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 h-9 w-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-2xl shadow-sm">
                🏍️
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Seleccionar Moto</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Elige la moto para asignar el abono</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 mb-4">
              {motos.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMotoSeleccionada(m);
                    setShowSelectModal(false);
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 bg-slate-50 dark:bg-slate-950/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all text-left text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="placa-colombiana font-mono font-black px-2.5 py-1 rounded-lg text-xs">
                      {m.placa}
                    </span>
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-slate-200">{m.propietario}</p>
                      <p className="text-slate-400">{m.marca} {m.modelo}</p>
                    </div>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Elegir →</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSelectModal(false)}
              className="btn-secondary w-full py-3 text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal Abono Form */}
      {motoSeleccionada && (
        <ModalAbono
          moto={motoSeleccionada}
          onClose={() => setMotoSeleccionada(null)}
          onCreado={() => {
            setMotoSeleccionada(null);
            cargar();
          }}
        />
      )}

    </div>
  );
}