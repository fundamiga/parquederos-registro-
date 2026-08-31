import { useEffect, useState } from 'react';
import { listarMotos, crearMoto, actualizarMoto, eliminarMoto } from '../services/motosService';
import ModalAbono from '../components/ModalAbono';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Motos() {
  const [motos, setMotos] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ placa: '', propietario: '', telefono: '', marca: '', modelo: '', modalidad_pago: 'quincenal' });
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [motoParaAbono, setMotoParaAbono] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const nueva = searchParams.get('nueva');
    if (nueva) {
      setEditandoId(null);
      setForm((f) => ({ ...f, placa: nueva.toUpperCase() }));
      setShowModal(true);
    }
  }, [searchParams]);

  const cargar = async () => {
    try {
      const { data } = await listarMotos(search);
      setMotos(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargar();
  }, [search]);

  const abrirCrear = () => {
    setEditandoId(null);
    setForm({ placa: '', propietario: '', telefono: '', marca: '', modelo: '', modalidad_pago: 'quincenal' });
    setShowModal(true);
  };

  const abrirEditar = (m) => {
    setEditandoId(m.id);
    setForm({
      placa: m.placa || '',
      propietario: m.propietario || '',
      telefono: m.telefono || '',
      marca: m.marca || '',
      modelo: m.modelo || '',
      modalidad_pago: m.modalidad_pago || 'quincenal',
    });
    setShowModal(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.placa || !form.propietario) return alert('Placa y Propietario son obligatorios');
    setCargando(true);
    try {
      if (editandoId) {
        await actualizarMoto(editandoId, form);
      } else {
        await crearMoto(form);
      }
      setForm({ placa: '', propietario: '', telefono: '', marca: '', modelo: '', modalidad_pago: 'quincenal' });
      setEditandoId(null);
      setShowModal(false);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar moto');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id, placa) => {
    if (!confirm(`¿Estás seguro de eliminar el registro de la moto con placa ${placa}?`)) return;
    try {
      await eliminarMoto(id);
      cargar();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  // Obtener estado del plan más reciente de una moto
  const obtenerEstadoPlan = (m) => {
    const abonos = m.abonos || [];
    if (abonos.length === 0) {
      return {
        tipo: m.modalidad_pago || 'Sin plan',
        estado: 'sin_abono',
        texto: m.modalidad_pago ? `Modalidad ${m.modalidad_pago.toUpperCase()}` : 'Sin plan activo',
        badgeClass: 'badge-warning',
      };
    }

    // Ordenar por fecha_fin desc
    const sorted = [...abonos].sort((a, b) => new Date(b.fecha_fin) - new Date(a.fecha_fin));
    const ult = sorted[0];
    const hoyStr = new Date().toISOString().slice(0, 10);
    const tipo = (ult.observaciones && ult.observaciones.includes('SEMANAL')) ? 'semanal' : ult.tipo;
    const vencido = ult.fecha_fin < hoyStr;

    if (vencido) {
      return {
        tipo,
        estado: 'vencido',
        texto: `${tipo.toUpperCase()} VENCIDO`,
        fechaFin: ult.fecha_fin,
        badgeClass: 'badge-danger animate-pulse',
      };
    } else {
      const diasRest = Math.ceil((new Date(ult.fecha_fin) - new Date(hoyStr)) / (1000 * 60 * 60 * 24));
      return {
        tipo,
        estado: 'vigente',
        texto: `${tipo.toUpperCase()} (${diasRest}d restantes)`,
        fechaFin: ult.fecha_fin,
        badgeClass: tipo === 'semanal' ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40 border' : 'badge-success',
      };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 md:pb-10 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-success text-[10px] sm:text-xs font-black">
              🏍️ Motos y Trabajadores
            </span>
            <span className="text-xs text-slate-400 font-medium">Fundación Funda Amiga</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Motos Registradas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Registro, planes vigentes (Quincenas, Semanas, Mensualidades) y datos de contacto.
          </p>
        </div>

        <button
          onClick={abrirCrear}
          className="btn-primary py-3.5 px-6 text-sm font-black shadow-lg"
        >
          <span>➕</span> Registrar Nueva Moto
        </button>
      </div>

      {/* Search Input */}
      <div className="card p-3 flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span className="pl-2 text-slate-400 text-base">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por placa, propietario, teléfono o marca..."
          className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pr-2 font-bold">
            ✕
          </button>
        )}
      </div>

      {/* Grid of Bikes */}
      {motos.length === 0 ? (
        <div className="card text-center py-16 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl text-slate-400">
            🏍️
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">No hay motos registradas</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {search ? 'No se encontraron resultados para la búsqueda.' : 'Comienza registrando la primera moto en la fundación.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {motos.map((m) => {
            const planInfo = obtenerEstadoPlan(m);
            return (
              <div
                key={m.id}
                className="card p-5 flex flex-col justify-between gap-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="placa-colombiana font-mono text-xl px-3 py-1 rounded-xl font-black shadow-xs">
                      {m.placa}
                    </div>
                    <span className={`badge text-[10px] font-black uppercase ${planInfo.badgeClass}`}>
                      {planInfo.texto}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirEditar(m)}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                      title="Editar información de la moto y dueño"
                    >
                      <span>✏️</span>
                    </button>
                    <button
                      onClick={() => handleEliminar(m.id, m.placa)}
                      className="text-slate-400 hover:text-rose-500 text-xs font-semibold p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Eliminar moto"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TRABAJADOR / PROPIETARIO</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block truncate">{m.propietario}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Teléfono:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{m.telefono || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Marca / Modelo:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                        {m.marca || '—'} {m.modelo || ''}
                      </span>
                    </div>
                  </div>

                  {/* Botón Asignar / Pagar Plan */}
                  <div className="pt-2">
                    <button
                      onClick={() => setMotoParaAbono(m)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>💳</span> Pagar / Renovar Quincena o Mes
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Pagar / Renovar Abono */}
      {motoParaAbono && (
        <ModalAbono
          moto={motoParaAbono}
          onClose={() => setMotoParaAbono(null)}
          onCreado={() => {
            setMotoParaAbono(null);
            cargar();
          }}
        />
      )}

      {/* Modal Crear / Editar Moto */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="card-glass w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 h-9 w-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-2xl shadow-sm">
                {editandoId ? '✏️' : '🏍️'}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {editandoId ? 'Editar Información de la Moto' : 'Registrar Nueva Moto'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {editandoId ? 'Modifica los datos del propietario y vehículo' : 'Fundación Funda Amiga — Parqueadero'}
                </p>
              </div>
            </div>

            <form onSubmit={handleGuardar} className="grid grid-cols-2 gap-3.5">
              <div className="col-span-2">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Placa de la Moto *
                </label>
                <input
                  value={form.placa}
                  onChange={(e) => setForm((f) => ({ ...f, placa: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                  placeholder="SGV40F"
                  maxLength={6}
                  className="input font-mono text-2xl tracking-[0.25em] font-black text-center border-2 border-emerald-500/80 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-yellow-300 py-3"
                  required
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Nombre del Trabajador / Dueño *
                </label>
                <input
                  value={form.propietario}
                  onChange={(e) => setForm((f) => ({ ...f, propietario: e.target.value }))}
                  placeholder="Ej: Carlos Mendoza"
                  className="input py-3 font-bold"
                  required
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  value={form.telefono}
                  onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                  placeholder="Ej: 3124567890"
                  className="input py-3"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Marca
                </label>
                <input
                  value={form.marca}
                  onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
                  placeholder="Ej: Yamaha"
                  className="input py-3"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Modelo / Línea
                </label>
                <input
                  value={form.modelo}
                  onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
                  placeholder="Ej: NMAX 155"
                  className="input py-3"
                />
              </div>

              <div className="col-span-2 flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1 py-3.5 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="btn-primary flex-1 py-3.5 text-sm font-black shadow-lg"
                >
                  <span>💾</span> {cargando ? 'Guardando...' : (editandoId ? 'Guardar Cambios' : 'Guardar Moto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}