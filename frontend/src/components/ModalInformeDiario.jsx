import { useState, useEffect } from 'react';
import { getInformeDiario } from '../services/parqueaderoService';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ModalInformeDiario({ onClose, fechaInicial }) {
  const [fecha, setFecha] = useState(fechaInicial || format(new Date(), 'yyyy-MM-dd'));
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarInforme = async (fechaConsulta) => {
    setCargando(true);
    try {
      const resp = await getInformeDiario(fechaConsulta);
      setDatos(resp.data);
    } catch (err) {
      alert('Error cargando informe: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarInforme(fecha);
  }, [fecha]);

  const cambiarDia = (offset) => {
    const f = parseISO(fecha);
    const nueva = offset > 0 ? addDays(f, offset) : subDays(f, Math.abs(offset));
    setFecha(format(nueva, 'yyyy-MM-dd'));
  };

  const formatearFechaDisplay = () => {
    try {
      return format(parseISO(fecha), "EEEE, dd 'de' MMMM yyyy", { locale: es });
    } catch {
      return fecha;
    }
  };

  // Generar texto para WhatsApp
  const compartirWhatsApp = () => {
    if (!datos) return;
    const { totales, visitantes_dia, abonos_pagados } = datos;

    let texto = `*🏍️ INFORME DE CAJA DIARIO — FUNDACIÓN FUNDA AMIGA*\n`;
    texto += `📅 *Fecha:* ${formatearFechaDisplay()}\n`;
    texto += `-------------------------------------------\n`;
    texto += `💰 *GRAN TOTAL RECAUDADO:* $${totales.gran_total.toLocaleString()} COP\n`;
    texto += `-------------------------------------------\n\n`;

    texto += `*1️⃣ VISITANTES POR DÍA ($700 COP):*\n`;
    texto += `• Total recaudado: $${totales.total_visitantes.toLocaleString()} COP (${totales.conteo_visitantes} motos)\n`;
    if (visitantes_dia.length > 0) {
      visitantes_dia.forEach((v, i) => {
        const placa = v.motos?.placa || 'SIN PLACA';
        const horaE = v.hora_entrada ? format(parseISO(v.hora_entrada), 'hh:mm a') : '--';
        const horaS = v.hora_salida ? format(parseISO(v.hora_salida), 'hh:mm a') : 'Dentro';
        texto += `  ${i + 1}. [${placa}] Entró: ${horaE} | Salió: ${horaS} → $${v.cobro_extra} COP\n`;
      });
    } else {
      texto += `  (No hubo visitantes en esta fecha)\n`;
    }

    texto += `\n*2️⃣ ABONOS Y MENSUALIDADES COBRADAS HOY:*\n`;
    texto += `• Total recaudado: $${totales.total_abonos.toLocaleString()} COP (${totales.conteo_abonos_pagados} pagos)\n`;
    if (abonos_pagados.length > 0) {
      abonos_pagados.forEach((a, i) => {
        const placa = a.motos?.placa || 'SIN PLACA';
        const prop = a.motos?.propietario || '';
        const tipo = a.tipo === 'mensual' ? 'Mes' : 'Quincena';
        const hora = a.hora_pago || a.created_at ? format(parseISO(a.hora_pago || a.created_at), 'hh:mm a') : '';
        texto += `  ${i + 1}. [${placa}] ${prop} (${tipo}) ${hora ? 'a las ' + hora : ''} → $${a.monto.toLocaleString()} COP\n`;
      });
    } else {
      texto += `  (No se cobraron abonos en esta fecha)\n`;
    }

    texto += `\n*📊 RESUMEN GENERAL:*\n`;
    texto += `• Total motos atendidas en el día: ${totales.conteo_total_motos}\n`;
    texto += `• Entradas de abonados al día: ${totales.conteo_abonados_entradas}\n`;
    texto += `\n_Generado automáticamente por PlacaMoto — FundaAmiga_`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const imprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="card-glass w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-7 relative max-h-[92vh] overflow-y-auto flex flex-col gap-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 h-9 w-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-2xl shadow-sm">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-success text-[10px] font-black">Cierre de Caja Diario</span>
                <span className="text-xs text-slate-400 font-bold">Fundación Funda Amiga</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 capitalize">
                Informe de Recaudo
              </h2>
            </div>
          </div>

          {/* Selector de Fecha */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => cambiarDia(-1)}
              className="px-2.5 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
              title="Día Anterior"
            >
              ◀
            </button>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-100 px-2 py-1 focus:outline-none cursor-pointer"
            />
            <button
              onClick={() => cambiarDia(1)}
              className="px-2.5 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
              title="Día Siguiente"
            >
              ▶
            </button>
            <button
              onClick={() => setFecha(format(new Date(), 'yyyy-MM-dd'))}
              className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-bold shadow-xs ml-1"
            >
              Hoy
            </button>
          </div>
        </div>

        {cargando ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <span className="animate-spin text-3xl">⚙️</span>
            <p className="text-xs font-bold">Generando informe financiero del día...</p>
          </div>
        ) : datos ? (
          <>
            {/* 3 KPI CARDS DE RECAUDO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              {/* Card 1: Visitantes Día $700 */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 p-4 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    🟡 Visitantes por Día ($700)
                  </span>
                  <span className="text-xl">🛵</span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-amber-900 dark:text-yellow-300 font-mono">
                    ${datos.totales.total_visitantes.toLocaleString()} COP
                  </span>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                    {datos.totales.conteo_visitantes} motos atendidas
                  </p>
                </div>
              </div>

              {/* Card 2: Abonos Cobrados Hoy */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 p-4 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    🟢 Abonos & Mensualidades
                  </span>
                  <span className="text-xl">💳</span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-emerald-900 dark:text-emerald-300 font-mono">
                    ${datos.totales.total_abonos.toLocaleString()} COP
                  </span>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                    {datos.totales.conteo_abonos_pagados} pagos recibidos hoy
                  </p>
                </div>
              </div>

              {/* Card 3: Gran Total de Caja */}
              <div className="bg-slate-900 text-white dark:bg-slate-950 border-2 border-emerald-500 p-4 rounded-2xl flex flex-col justify-between shadow-lg shadow-emerald-950/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                    💰 TOTAL CAJA DEL DÍA
                  </span>
                  <span className="text-xl">💵</span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                    ${datos.totales.gran_total.toLocaleString()} COP
                  </span>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Total neto recaudado
                  </p>
                </div>
              </div>

            </div>

            {/* SECCIÓN 1: MOTOS QUE PAGARON EL DÍA ($700) */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span>🟡</span> Motos que Pagaron Tarifa de Día ($700 COP)
                </h3>
                <span className="badge badge-warning text-[10px]">
                  {datos.visitantes_dia.length} registros
                </span>
              </div>

              {datos.visitantes_dia.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-center text-xs text-slate-400 italic">
                  No se registraron cobros de día para esta fecha.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/90 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black">
                      <tr>
                        <th className="py-3 px-3.5">Placa</th>
                        <th className="py-3 px-3.5">Propietario / Conductor</th>
                        <th className="py-3 px-3.5">Entrada</th>
                        <th className="py-3 px-3.5">Salida</th>
                        <th className="py-3 px-3.5 text-right">Valor Pagado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {datos.visitantes_dia.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3.5">
                            <span className="placa-colombiana font-mono font-black px-2 py-0.5 rounded text-xs inline-block">
                              {v.motos?.placa}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-slate-800 dark:text-slate-200">
                            {v.motos?.propietario}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 font-semibold">
                            {v.hora_entrada ? format(parseISO(v.hora_entrada), 'hh:mm a', { locale: es }) : '--'}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 font-semibold">
                            {v.hora_salida ? format(parseISO(v.hora_salida), 'hh:mm a', { locale: es }) : (
                              <span className="badge badge-info text-[9px]">En Parqueo</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-black text-amber-700 dark:text-yellow-300 font-mono">
                            ${v.cobro_extra?.toLocaleString()} COP
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: ABONOS Y MENSUALIDADES PAGADAS HOY */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span>🟢</span> Abonos Cobrados Hoy (Quincenas $7.000 / Mes $14.000)
                </h3>
                <span className="badge badge-success text-[10px]">
                  {datos.abonos_pagados.length} pagos
                </span>
              </div>

              {datos.abonos_pagados.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-center text-xs text-slate-400 italic">
                  No se registraron pagos de suscripciones en esta fecha.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/90 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black">
                      <tr>
                        <th className="py-3 px-3.5">Placa</th>
                        <th className="py-3 px-3.5">Propietario</th>
                        <th className="py-3 px-3.5">Tipo de Abono</th>
                        <th className="py-3 px-3.5">Hora del Pago</th>
                        <th className="py-3 px-3.5">Período de Vigencia</th>
                        <th className="py-3 px-3.5 text-right">Monto Recibido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {datos.abonos_pagados.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3.5">
                            <span className="placa-colombiana font-mono font-black px-2 py-0.5 rounded text-xs inline-block">
                              {a.motos?.placa}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-slate-800 dark:text-slate-200">
                            {a.motos?.propietario}
                          </td>
                          <td className="py-2.5 px-3.5 font-black capitalize text-slate-700 dark:text-slate-300">
                            {a.tipo === 'mensual' ? '📅 Mes (30 días)' : '🗓️ Quincena (15 días)'}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 font-semibold">
                            {a.hora_pago || a.created_at ? format(parseISO(a.hora_pago || a.created_at), 'hh:mm a', { locale: es }) : '--'}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 text-[11px]">
                            {format(parseISO(a.fecha_inicio), 'dd MMM', { locale: es })} al {format(parseISO(a.fecha_fin), 'dd MMM yyyy', { locale: es })}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            ${a.monto?.toLocaleString()} COP
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* BOTONES DE ACCIÓN: COMPARTIR WHATSAPP / IMPRIMIR / CERRAR */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              
              <button
                onClick={compartirWhatsApp}
                className="btn-success flex-1 py-3.5 text-xs sm:text-sm font-black shadow-lg"
              >
                <span>📲</span> Compartir Cierre por WhatsApp
              </button>

              <button
                onClick={imprimir}
                className="btn-secondary py-3.5 px-5 text-xs sm:text-sm font-bold shrink-0"
              >
                <span>🖨️</span> Imprimir / PDF
              </button>

              <button
                onClick={onClose}
                className="btn-secondary py-3.5 px-5 text-xs sm:text-sm font-bold shrink-0"
              >
                Cerrar
              </button>

            </div>
          </>
        ) : null}

      </div>
    </div>
  );
}