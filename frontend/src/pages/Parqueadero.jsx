import { useEffect, useState } from 'react';
import { getActivos, registrarSalida } from '../services/parqueaderoService';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const tiempoDesde = (hora) => {
  const m = differenceInMinutes(new Date(), parseISO(hora));
  const h = Math.floor(m / 60), min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min} min`;
};

export default function Parqueadero() {
  const [activos, setActivos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState('');

  const cargar = async () => {
    try {
      const { data } = await getActivos();
      setActivos(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSalida = async (id, placa, cobro_extra) => {
    const msg = cobro_extra > 0
      ? `¿Confirmar salida de la moto ${placa} y cobro de $${cobro_extra} COP?`
      : `¿Confirmar salida para la moto con placa ${placa}?`;
    if (!confirm(msg)) return;
    setCargando(true);
    try {
      await registrarSalida(id, cobro_extra || 0);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar salida');
    } finally {
      setCargando(false);
    }
  };

  const listaFiltrada = activos.filter((a) => {
    const search = filtro.toLowerCase();
    const placa = a.motos?.placa?.toLowerCase() || '';
    const prop = a.motos?.propietario?.toLowerCase() || '';
    return placa.includes(search) || prop.includes(search);
  });

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 md:pb-10 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-info text-[10px] sm:text-xs font-black">
              🅿️ Monitoreo en Vivo
            </span>
            <span className="text-xs text-slate-400 font-medium">Fundación Funda Amiga</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            Motos en Parqueadero
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Tiempo de permanencia y registro de salida rápido con un toque.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="card p-3 sm:px-4 sm:py-2.5 flex items-center gap-3 bg-slate-900 border-slate-800">
            <span className="text-2xl">🏍️</span>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OCUPACIÓN</span>
              <span className="text-xl font-black text-emerald-400 font-mono">{activos.length} motos</span>
            </div>
          </div>
          <Link to="/escaner" className="btn-primary py-3 px-5 text-xs sm:text-sm font-black shadow-lg">
            <span>📸</span> Escanear
          </Link>
        </div>
      </div>

      {/* Search Filter */}
      <div className="card p-3 flex items-center gap-3 bg-slate-900/90 border-slate-800">
        <span className="pl-2 text-slate-400 text-base">🔍</span>
        <input
          type="text"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por placa o nombre de propietario..."
          className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-100 focus:outline-none placeholder:text-slate-500"
        />
        {filtro && (
          <button onClick={() => setFiltro('')} className="text-xs text-slate-400 hover:text-slate-200 pr-2 font-bold">
            ✕
          </button>
        )}
      </div>

      {/* Grid of parked bikes */}
      {listaFiltrada.length === 0 ? (
        <div className="card text-center py-16 flex flex-col items-center justify-center gap-3">
          <div className="h-16 w-16 rounded-3xl bg-slate-800/80 flex items-center justify-center text-3xl text-slate-400">
            🅿️
          </div>
          <div>
            <h3 className="font-bold text-slate-200 text-base">No hay motos adentro</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {filtro ? 'No se encontraron resultados con ese criterio.' : 'Cuando una moto ingrese mediante el escáner aparecerá listada aquí.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listaFiltrada.map((item) => (
            <div
              key={item.id}
              className="card-interactive p-5 flex flex-col justify-between gap-4 border border-slate-800 bg-slate-900/90"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="placa-colombiana font-mono text-xl px-3 py-1 rounded-xl font-black">
                  {item.motos?.placa}
                </div>
                <span className="badge badge-info text-[11px] font-bold flex items-center gap-1">
                  <span className="animate-pulse">⏱️</span>
                  <span>{tiempoDesde(item.hora_entrada)}</span>
                </span>
              </div>

              {/* Moto details */}
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">Propietario:</span>
                  <span className="font-extrabold text-slate-200">{item.motos?.propietario}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">Teléfono:</span>
                  <span className="font-semibold text-slate-300">{item.motos?.telefono || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">Marca / Modelo:</span>
                  <span className="font-semibold text-slate-300">{item.motos?.marca || '—'} {item.motos?.modelo || ''}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 font-medium">Hora de Entrada:</span>
                  <span className="font-bold text-emerald-400">
                    {format(parseISO(item.hora_entrada), 'hh:mm a', { locale: es })}
                  </span>
                </div>
                {item.cobro_extra > 0 && (
                  <div className="bg-amber-950/50 border border-amber-500/40 p-2 rounded-xl text-center text-yellow-300 font-black text-xs mt-1">
                    Tarifa Visitante por Día: ${item.cobro_extra} COP
                  </div>
                )}
              </div>

              {/* Action */}
              <button
                onClick={() => handleSalida(item.id, item.motos?.placa, item.cobro_extra)}
                disabled={cargando}
                className="btn-danger w-full py-3 text-xs font-black shadow-lg"
              >
                <span>⬅️</span> {item.cobro_extra > 0 ? `Cobrar $${item.cobro_extra} y Salir` : 'Registrar Salida'}
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}