import { useEffect, useState } from 'react';
import { listarAbonos, eliminarAbono } from '../services/abonosService';
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
      <div className="flex items-center gap-2 bg-sky-950/40 border border-sky-500/30 rounded-xl px-3 py-2 mt-1">
        <span className="text-base">🕐</span>
        <div>
          <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider block">Hora de Registro</span>
          <span className="text-xs font-black text-sky-200">{fecha} — {hora}</span>
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
  const [filtroMoto, setFiltroMoto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            Pagos y Abonos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Control de mensualidades ($14.000) y quincenas ($7.000) de parqueadero.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 card p-3 bg-slate-900/90 border-slate-800">
        <select
          value={filtroMoto}
          onChange={(e) => setFiltroMoto(e.target.value)}
          className="input text-xs"
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
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {est}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Grid */}
      {abonosFiltrados.length === 0 ? (
        <div className="card text-center py-16 flex flex-col items-center justify-center gap-3">
          <div className="h-16 w-16 rounded-3xl bg-slate-800/80 flex items-center justify-center text-3xl text-slate-400">
            💳
          </div>
          <div>
            <h3 className="font-bold text-slate-200 text-base">No hay abonos encontrados</h3>
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
                className={`card-interactive p-5 flex flex-col justify-between gap-4 border ${
                  vencido ? 'border-rose-500/40 bg-rose-950/15' : 'border-emerald-500/40 bg-emerald-950/15'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="placa-colombiana font-mono text-lg px-3 py-1 rounded-xl font-black">
                      {a.motos?.placa}
                    </span>
                    <span className={`badge text-[10px] font-black ${vencido ? 'badge-danger' : 'badge-success'}`}>
                      {vencido ? 'VENCIDO' : 'VIGENTE'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleEliminar(a.id)}
                    className="text-slate-500 hover:text-rose-400 text-xs p-1.5 rounded-lg hover:bg-rose-950/40"
                  >
                    🗑️
                  </button>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Propietario:</span>
                    <span className="font-extrabold text-slate-100 text-sm block truncate">{a.motos?.propietario}</span>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between mt-1">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TIPO</span>
                      <span className="font-extrabold text-slate-200 capitalize">{a.tipo}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">VALOR</span>
                      <span className="font-black text-emerald-400 text-sm font-mono">${a.monto?.toLocaleString()} COP</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                    <span>Desde: {format(parseISO(a.fecha_inicio), 'dd MMM yyyy', { locale: es })}</span>
                    <span className="font-bold text-slate-200">
                      Vence: {format(parseISO(a.fecha_fin), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>

                  {/* Hora exacta de pago */}
                  <HoraPago abono={a} />

                  {/* Observaciones / Notas */}
                  {a.observaciones && (
                    <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl px-3 py-2 mt-1">
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">📝 Nota</span>
                      <span className="text-xs text-amber-200 font-medium">{a.observaciones}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Select Moto for New Abono Modal */}
      {showSelectModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="card-glass w-full max-w-md bg-slate-900 border border-slate-700/80 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowSelectModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 h-9 w-9 rounded-full flex items-center justify-center bg-slate-800/80 hover:bg-slate-700"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-800/80">
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-lg">
                🏍️
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-100">Seleccionar Moto</h2>
                <p className="text-xs text-slate-400 font-medium">Elige la moto para asignar el abono</p>
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
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-800 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-emerald-950/20 transition-all text-left text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="placa-colombiana font-mono font-black px-2.5 py-1 rounded-lg text-xs">
                      {m.placa}
                    </span>
                    <div>
                      <p className="font-extrabold text-slate-200">{m.propietario}</p>
                      <p className="text-slate-400">{m.marca} {m.modelo}</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold">Elegir →</span>
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