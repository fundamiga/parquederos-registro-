import { useEffect, useState, useMemo } from 'react';
import { getDashboard, getActivos, getInformeDiario } from '../services/parqueaderoService';
import { listarAbonos } from '../services/abonosService';
import ModalInformeDiario from '../components/ModalInformeDiario';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activos, setActivos] = useState([]);
  const [abonosVencen, setAbonosVencen] = useState([]);
  const [informeHoy, setInformeHoy] = useState(null);
  const [filtroMovimiento, setFiltroMovimiento] = useState('todos'); // 'todos', 'diario', 'semanal', 'quincenal', 'mensual', 'abono_ingreso'
  const [cargando, setCargando] = useState(true);
  const [showInforme, setShowInforme] = useState(false);

  const hoyFecha = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, actRes, abRes, infRes] = await Promise.all([
          getDashboard(),
          getActivos(),
          listarAbonos(),
          getInformeDiario(hoyFecha),
        ]);
        setStats(dashRes.data);
        setActivos(actRes.data || []);
        setInformeHoy(infRes.data);

        const hoy = new Date();
        const en5dias = new Date();
        en5dias.setDate(hoy.getDate() + 5);

        const proximos = (abRes.data || []).filter((a) => {
          const fin = new Date(a.fecha_fin);
          return fin >= hoy && fin <= en5dias;
        });
        setAbonosVencen(proximos);
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setCargando(false);
      }
    };

    fetchData();
  }, [hoyFecha]);

  // Construir lista unificada de todos los movimientos del día
  const movimientos = useMemo(() => {
    if (!informeHoy) return [];

    // 1. Entradas (Visitantes Día $700, Semanales $3500 e Ingresos Abonados)
    const movEntradas = (informeHoy.visitantes_dia || [])
      .concat(informeHoy.entradas_abonados || [])
      .map((e) => {
        let categoria = 'abono_ingreso';
        let etiqueta = '🟢 Ingreso con Abono';
        if (e.cobro_extra === 3500) {
          categoria = 'semanal';
          etiqueta = '🟣 Semanal ($3.500)';
        } else if (e.cobro_extra === 700) {
          categoria = 'diario';
          etiqueta = '🟡 Diario ($700)';
        } else if (e.cobro_extra > 0) {
          categoria = 'diario';
          etiqueta = `🟡 Tarifa Día ($${e.cobro_extra.toLocaleString()})`;
        }

        return {
          id: `ent_${e.id}`,
          tipo_categoria: categoria,
          tipo_etiqueta: etiqueta,
          placa: e.motos?.placa || 'MOTO',
          propietario: e.motos?.propietario || 'Visitante',
          telefono: e.motos?.telefono,
          hora: e.hora_entrada,
          hora_salida: e.hora_salida,
          estado: e.hora_salida ? 'Salida' : 'En Parqueadero',
          monto: Number(e.cobro_extra) || 0,
        };
      });

    // 2. Abonos / Quincenas / Mensualidades pagadas hoy
    const movAbonos = (informeHoy.abonos_pagados || []).map((a) => ({
      id: `abo_${a.id}`,
      tipo_categoria: a.tipo === 'mensual' ? 'mensual' : 'quincenal',
      tipo_etiqueta: a.tipo === 'mensual' ? '📅 Pago Mes ($14.000)' : '🗓️ Pago Quincena ($7.000)',
      placa: a.motos?.placa || 'MOTO',
      propietario: a.motos?.propietario || 'Trabajador Registrado',
      telefono: a.motos?.telefono,
      hora: a.hora_pago || a.created_at,
      hora_salida: null,
      estado: 'Pago Registrado',
      monto: Number(a.monto) || 0,
    }));

    return [...movEntradas, ...movAbonos].sort((a, b) => new Date(b.hora) - new Date(a.hora));
  }, [informeHoy]);

  // Filtrar movimientos según pestaña seleccionada
  const movimientosFiltrados = useMemo(() => {
    if (filtroMovimiento === 'todos') return movimientos;
    return movimientos.filter((m) => m.tipo_categoria === filtroMovimiento);
  }, [movimientos, filtroMovimiento]);

  // Conteos para los botones de filtro
  const conteos = useMemo(() => {
    return {
      todos: movimientos.length,
      diario: movimientos.filter((m) => m.tipo_categoria === 'diario').length,
      semanal: movimientos.filter((m) => m.tipo_categoria === 'semanal').length,
      quincenal: movimientos.filter((m) => m.tipo_categoria === 'quincenal').length,
      mensual: movimientos.filter((m) => m.tipo_categoria === 'mensual').length,
      abono_ingreso: movimientos.filter((m) => m.tipo_categoria === 'abono_ingreso').length,
    };
  }, [movimientos]);

  // Total de dinero recaudado en la selección actual
  const totalDineroFiltrado = useMemo(() => {
    return movimientosFiltrados.reduce((acc, m) => acc + (m.monto || 0), 0);
  }, [movimientosFiltrados]);

  const cards = [
    {
      title: 'Motos Adentro Ahora',
      valor: stats?.motos_adentro ?? 0,
      icon: '🅿️',
      color: 'text-sky-500 dark:text-sky-400',
      bgGlow: 'from-sky-500/10 to-indigo-500/5',
      borderColor: 'border-sky-500/30',
      link: '/parqueadero',
      sub: 'En parqueadero en vivo',
    },
    {
      title: 'Entradas del Día',
      valor: stats?.total_entradas ?? 0,
      icon: '📥',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgGlow: 'from-emerald-500/10 to-teal-500/5',
      borderColor: 'border-emerald-500/30',
      link: '/historial',
      sub: 'Ingresos registrados hoy',
    },
    {
      title: 'Gran Total Recaudo Hoy',
      valor: informeHoy ? `$${informeHoy.totales.gran_total.toLocaleString()} COP` : '$0 COP',
      icon: '💰',
      color: 'text-amber-600 dark:text-yellow-300',
      bgGlow: 'from-amber-500/10 to-yellow-500/5',
      borderColor: 'border-amber-500/30',
      link: '#tabla-movimientos',
      sub: 'Visitantes + Abonos cobrados',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 md:pb-10 flex flex-col gap-6 sm:gap-8">
      
      {/* Banner Principal */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-success text-[10px] sm:text-xs font-black">
                ⚡ Parqueadero Cartón de Colombia
              </span>
              <span className="text-xs text-emerald-300/80 font-medium">Fundación Funda Amiga</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Panel de Control & Recaudo
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Monitoreo en tiempo real: <span className="text-yellow-400 font-bold">Día ($700)</span>, <span className="text-purple-300 font-bold">Semana ($3.500)</span>, <span className="text-emerald-400 font-bold">Quincena ($7.000)</span> y <span className="text-emerald-300 font-bold">Mes ($14.000)</span>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => setShowInforme(true)}
              className="btn-secondary py-3.5 px-5 text-sm font-black shadow-md bg-white/10 dark:bg-slate-800 text-white border-white/20 hover:bg-white/20"
            >
              <span>📊</span> Cierre de Caja Diario
            </button>
            <Link
              to="/escaner"
              className="btn-primary py-3.5 px-6 text-sm font-black shadow-lg"
            >
              <span>📸</span>
              <span>Abrir Escáner IA</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.title}
            to={c.link}
            className={`card p-5 bg-gradient-to-b ${c.bgGlow} ${c.borderColor} hover:border-slate-400 dark:hover:border-slate-600 transition-all flex flex-col justify-between group shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {c.title}
              </span>
              <span className="text-2xl group-hover:scale-110 transition-transform">{c.icon}</span>
            </div>
            <div>
              <span className={`text-2xl sm:text-3xl font-black ${c.color} font-mono block`}>
                {c.valor}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-1">
                {c.sub}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* TABLA PRINCIPAL DE TODOS LOS MOVIMIENTOS DEL DÍA CON FILTROS */}
      <div id="tabla-movimientos" className="card p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col gap-4">
        
        {/* Header de la Tabla */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>📋</span> Movimientos y Recaudo del Día
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Registro en vivo de todos los ingresos de motos y pagos realizados hoy ({format(new Date(), "dd 'de' MMMM yyyy", { locale: es })}).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge badge-success text-[10px] font-black">
              {movimientosFiltrados.length} Registros
            </span>
            <span className="badge badge-neutral text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400">
              Total: ${totalDineroFiltrado.toLocaleString()} COP
            </span>
          </div>
        </div>

        {/* Barra de Filtros Interactivos */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
          <button
            onClick={() => setFiltroMovimiento('todos')}
            className={`px-3 py-2 rounded-xl font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filtroMovimiento === 'todos'
                ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>✨ Todos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-black">{conteos.todos}</span>
          </button>

          <button
            onClick={() => setFiltroMovimiento('diario')}
            className={`px-3 py-2 rounded-xl font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filtroMovimiento === 'diario'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>🟡 Diarios ($700)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-black">{conteos.diario}</span>
          </button>

          <button
            onClick={() => setFiltroMovimiento('semanal')}
            className={`px-3 py-2 rounded-xl font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filtroMovimiento === 'semanal'
                ? 'bg-purple-600 text-white font-black shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>🟣 Semanales ($3.500)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-black">{conteos.semanal}</span>
          </button>

          <button
            onClick={() => setFiltroMovimiento('quincenal')}
            className={`px-3 py-2 rounded-xl font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filtroMovimiento === 'quincenal'
                ? 'bg-emerald-600 text-white font-black shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>🗓️ Quincenales ($7.000)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-black">{conteos.quincenal}</span>
          </button>

          <button
            onClick={() => setFiltroMovimiento('mensual')}
            className={`px-3 py-2 rounded-xl font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filtroMovimiento === 'mensual'
                ? 'bg-teal-600 text-white font-black shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>📅 Mensuales ($14.000)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-black">{conteos.mensual}</span>
          </button>

          <button
            onClick={() => setFiltroMovimiento('abono_ingreso')}
            className={`px-3 py-2 rounded-xl font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filtroMovimiento === 'abono_ingreso'
                ? 'bg-sky-600 text-white font-black shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>🟢 Ingresos con Abono</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-black">{conteos.abono_ingreso}</span>
          </button>
        </div>

        {/* Tabla de Registros */}
        {movimientosFiltrados.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
            <span className="text-3xl">🏍️</span>
            <p className="text-xs font-bold">No hay movimientos registrados para este filtro hoy.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Placa</th>
                  <th className="py-3.5 px-4">Propietario / Conductor</th>
                  <th className="py-3.5 px-4">Tipo de Movimiento</th>
                  <th className="py-3.5 px-4">Hora</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Valor Recaudado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {movimientosFiltrados.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="placa-colombiana font-mono font-black px-2.5 py-0.5 rounded-lg text-xs inline-block shadow-xs">
                        {m.placa}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 block">{m.propietario}</span>
                      {m.telefono && <span className="text-[10px] text-slate-400 block">{m.telefono}</span>}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {m.tipo_etiqueta}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-600 dark:text-slate-400">
                      {m.hora ? format(parseISO(m.hora), 'hh:mm a', { locale: es }) : '--'}
                    </td>
                    <td className="py-3 px-4">
                      {m.estado === 'En Parqueadero' ? (
                        <span className="badge badge-info text-[9px] font-bold">🅿️ En Parqueadero</span>
                      ) : m.estado === 'Salida' ? (
                        <span className="badge badge-neutral text-[9px] font-bold">✅ Salió</span>
                      ) : (
                        <span className="badge badge-success text-[9px] font-bold">💵 Pago Registrado</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-xs sm:text-sm">
                      {m.monto > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ${m.monto.toLocaleString()} COP
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold text-xs">$0 (Abono)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              
              {/* FILA DE TOTALES AL FINAL DE LA TABLA */}
              <tfoot className="bg-slate-100 dark:bg-slate-950 font-black border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                <tr>
                  <td colSpan={4} className="py-3.5 px-4 uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                    Total {movimientosFiltrados.length} Movimientos ({filtroMovimiento.toUpperCase()}):
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-right uppercase">
                    Recaudo Neto:
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-base font-black text-emerald-600 dark:text-yellow-300">
                    ${totalDineroFiltrado.toLocaleString()} COP
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

      </div>

      {/* Grid Inferior: Motos adentro & Vencimientos próximos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Motos Adentro */}
        <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>🅿️</span> Motos en Parqueadero ({activos.length})
              </h2>
              <Link to="/parqueadero" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                Ver todos →
              </Link>
            </div>

            {activos.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">No hay motos adentro en este momento.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-56 overflow-y-auto">
                {activos.slice(0, 5).map((a) => (
                  <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="placa-colombiana font-mono font-black px-2 py-0.5 rounded text-[11px]">
                      {a.motos?.placa}
                    </span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{a.motos?.propietario}</span>
                    <span className="text-slate-500 font-semibold">
                      {format(parseISO(a.hora_entrada), 'hh:mm a', { locale: es })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Abonos por Vencer */}
        <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>⏳</span> Próximos Vencimientos ({abonosVencen.length})
              </h2>
              <Link to="/abonos" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                Gestionar →
              </Link>
            </div>

            {abonosVencen.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">No hay abonos próximos a vencer.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-56 overflow-y-auto">
                {abonosVencen.slice(0, 5).map((ab) => (
                  <div key={ab.id} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="placa-colombiana font-mono font-black px-2 py-0.5 rounded text-[11px]">
                      {ab.motos?.placa}
                    </span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{ab.motos?.propietario}</span>
                    <span className="badge badge-warning text-[10px] font-bold">
                      Vence {format(parseISO(ab.fecha_fin), 'dd MMM', { locale: es })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal Informe Diario / Cierre de Caja */}
      {showInforme && (
        <ModalInformeDiario
          fechaInicial={hoyFecha}
          onClose={() => setShowInforme(false)}
        />
      )}

    </div>
  );
}