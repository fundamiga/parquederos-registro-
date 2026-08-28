import { useEffect, useState } from 'react';
import { getHistorial } from '../services/parqueaderoService';
import ModalInformeDiario from '../components/ModalInformeDiario';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Historial() {
  const [registros, setRegistros] = useState([]);
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [cargando, setCargando] = useState(false);
  const [showInforme, setShowInforme] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await getHistorial(fecha);
      setRegistros(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [fecha]);

  const duracion = (entrada, salida) => {
    if (!salida) return 'En parqueadero';
    const m = differenceInMinutes(parseISO(salida), parseISO(entrada));
    const h = Math.floor(m / 60);
    const min = m % 60;
    return h > 0 ? `${h}h ${min}m` : `${min} min`;
  };

  const totalRecaudo = registros.reduce((acc, r) => acc + (r.cobro_extra || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 md:pb-10 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-neutral text-[10px] sm:text-xs font-black">
              📋 Auditoría & Registros
            </span>
            <span className="text-xs text-slate-400 font-medium">Fundación Funda Amiga</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Historial de Entradas & Salidas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Registro cronológico de ingresos, salidas, cobros de día ($700) y abonos.
          </p>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Botón Destacado Informe Diario / Cierre de Caja */}
          <button
            onClick={() => setShowInforme(true)}
            className="btn-primary py-3 px-4 text-xs sm:text-sm font-black shadow-lg"
          >
            <span>📊</span> Cierre de Caja & Informe Diario
          </button>

          <div className="card px-3.5 py-2 flex items-center gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-sm">📅</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Table / Cards */}
      {registros.length === 0 ? (
        <div className="card text-center py-16 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900">
          <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-3xl text-slate-400">
            📋
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">No hay registros para esta fecha</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Selecciona otra fecha en el selector para revisar movimientos de días anteriores.
            </p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden p-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-4">Placa</th>
                  <th className="py-4 px-4">Propietario / Teléfono</th>
                  <th className="py-4 px-4">Hora Entrada</th>
                  <th className="py-4 px-4">Hora Salida</th>
                  <th className="py-4 px-4">Permanencia</th>
                  <th className="py-4 px-4 text-right">Cobro Realizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {registros.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="placa-colombiana font-mono font-black px-2.5 py-1 rounded-lg text-xs inline-block">
                        {r.motos?.placa}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-slate-900 dark:text-slate-200">{r.motos?.propietario}</p>
                      <p className="text-[11px] text-slate-400">{r.motos?.telefono || 'Sin teléfono'}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {format(parseISO(r.hora_entrada), 'hh:mm a', { locale: es })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {r.hora_salida ? (
                        format(parseISO(r.hora_salida), 'hh:mm a', { locale: es })
                      ) : (
                        <span className="badge badge-info text-[9px]">Dentro</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      ⏱️ {duracion(r.hora_entrada, r.hora_salida)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black">
                      {r.cobro_extra > 0 ? (
                        <span className="text-amber-700 dark:text-yellow-300 font-mono text-sm">${r.cobro_extra.toLocaleString()} COP</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">Cubierto por Abono</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Informe Diario / Cierre de Caja */}
      {showInforme && (
        <ModalInformeDiario
          fechaInicial={fecha}
          onClose={() => setShowInforme(false)}
        />
      )}

    </div>
  );
}