import { format, parseISO, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ResultadoPlaca({
  resultado,
  onEntradaAbono,
  onEntradaDia,
  onEntradaSemana,
  onVerTicket,
  onEditarMoto,
  onSalida,
  onRegistrar,
  onAbrirAbono,
  cargando,
}) {
  const placa = resultado.placa;
  const moto = resultado.moto;
  const abono_vigente = resultado.abono_vigente;
  const ultimo_abono = resultado.ultimo_abono || resultado.abono || null;
  const alarma = resultado.alarma;
  const mensaje_alarma = resultado.mensaje_alarma;
  const dias_restantes = resultado.dias_restantes ?? resultado.detalles_abono?.dias_restantes ?? 0;
  const dias_transcurridos = resultado.dias_transcurridos ?? resultado.detalles_abono?.dias_transcurridos ?? 0;
  const dias_vencido = resultado.dias_vencido ?? resultado.detalles_abono?.dias_vencido ?? 0;
  const entrada_activa = resultado.entrada_activa;

  const estaAdentro = Boolean(entrada_activa);

  // Calcular permanencia si está adentro
  const tiempoPermanencia = () => {
    if (!entrada_activa?.hora_entrada) return '';
    const mins = differenceInMinutes(new Date(), parseISO(entrada_activa.hora_entrada));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  // Formato fecha y hora de registro del abono
  const fechaHoraPago = () => {
    if (!ultimo_abono) return null;
    const ts = ultimo_abono.hora_pago || ultimo_abono.created_at || ultimo_abono.fecha_inicio;
    try {
      const d = new Date(ts);
      return format(d, "dd 'de' MMMM yyyy — hh:mm a", { locale: es });
    } catch {
      return ultimo_abono.fecha_inicio;
    }
  };

  const totalDiasPeriodo = ultimo_abono?.tipo === 'mensual' ? 30 : 15;
  const porcentajeDias = Math.min(100, Math.round(((dias_transcurridos + 1) / totalDiasPeriodo) * 100));

  return (
    <div className="card-glass bg-white dark:bg-slate-900 border-2 border-slate-300/80 dark:border-slate-800 shadow-2xl flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-300 p-5 sm:p-7">
      
      {/* 1. TOP HEADER: PLACA COLOMBIANA + ESTADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-200 dark:border-slate-800">
        
        {/* Placa Colombiana Oficial */}
        <div className="flex items-center gap-3">
          <div className="placa-colombiana rounded-2xl px-5 py-2 text-center inline-block shadow-md">
            <span className="text-[9px] font-black text-slate-900/70 uppercase tracking-widest block -mb-0.5">
              COLOMBIA
            </span>
            <span className="font-mono text-3xl sm:text-4xl font-black text-slate-950 tracking-[0.25em]">
              {placa}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Estado Parqueadero
            </span>
            <span className={`badge text-xs sm:text-sm font-black mt-0.5 ${
              estaAdentro ? 'badge-info' : 'badge-neutral'
            }`}>
              {estaAdentro ? '🅿️ ESTÁ ADENTRO' : '⚪ FUERA DEL PARQUEADERO'}
            </span>
          </div>
        </div>

        {/* Status Pill Suscripción */}
        <div>
          {moto ? (
            abono_vigente ? (
              <span className="badge badge-success text-xs sm:text-sm py-2 px-4 font-black">
                🟢 ABONO VIGENTE
              </span>
            ) : ultimo_abono ? (
              <span className="badge badge-danger text-xs sm:text-sm py-2 px-4 font-black animate-pulse">
                🚨 ABONO VENCIDO
              </span>
            ) : (
              <span className="badge badge-warning text-xs sm:text-sm py-2 px-4 font-black">
                🟡 PLAN SIN ACTIVAR
              </span>
            )
          ) : (
            <span className="badge badge-neutral text-xs sm:text-sm py-2 px-4 font-black">
              ⚪ NO REGISTRADA
            </span>
          )}
        </div>

      </div>

      {/* 2. ALARMA DESTACADA SI NO HA PAGADO O ESTÁ VENCIDO */}
      {alarma && (
        <div className="bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-400 dark:border-rose-500 text-rose-900 dark:text-rose-200 p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-start sm:items-center gap-3">
            <span className="text-3xl shrink-0">🚨</span>
            <div>
              <span className="font-black text-rose-800 dark:text-rose-100 text-sm sm:text-base block">
                ¡ATENCIÓN — COBRO REQUERIDO!
              </span>
              <p className="text-xs text-rose-700 dark:text-rose-200/90 mt-0.5 leading-relaxed font-semibold">
                {mensaje_alarma}
              </p>
            </div>
          </div>

          {moto && (
            <button
              onClick={onAbrirAbono}
              className="btn-success py-2.5 px-4 text-xs font-black shrink-0 w-full sm:w-auto shadow-md"
            >
              <span>💳</span> Pagar / Renovar Abono
            </button>
          )}
        </div>
      )}

      {/* 3. RESUMEN ESTRUCTURADO DE DATOS (PROPIETARIO + ABONO) */}
      {moto ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Datos Propietario y Moto */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>👤</span> DATOS PROPIETARIO Y MOTO
              </span>
              <div className="flex items-center gap-1.5">
                {onEditarMoto && (
                  <button
                    onClick={() => onEditarMoto(moto)}
                    className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                    title="Editar información de propietario"
                  >
                    <span>✏️</span> Editar
                  </button>
                )}
                <span className="badge badge-neutral text-[9px]">Registrado</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">• Nombre:</span>
                <span className="font-black text-slate-900 dark:text-slate-100 text-sm">{moto.propietario}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">• Teléfono / WhatsApp:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{moto.telefono || 'No registrado'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">• Vehículo / Moto:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{moto.marca || 'Moto'} {moto.modelo || ''}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Detalle del Abono & Conteo de Días */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>💳</span> DETALLE DEL ABONO & CONTEO DÍAS
              </span>
              <span className={`badge text-[9px] ${abono_vigente ? 'badge-success' : 'badge-danger'}`}>
                {abono_vigente ? 'Al Día' : 'Pendiente'}
              </span>
            </div>

            {ultimo_abono ? (
              <div className="flex flex-col gap-2 text-xs">
                
                {/* Tipo de Pago */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">• Duración del Plan:</span>
                  <span className="font-black text-slate-900 dark:text-slate-100 capitalize">
                    {ultimo_abono.tipo === 'mensual' ? '📅 Mensual (30 días)' : '🗓️ Quincenal (15 días)'}
                  </span>
                </div>

                {/* Inicio del Período */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">• 🕐 Inicio del Período:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{fechaHoraPago()}</span>
                </div>

                {/* Modalidad de Cobro */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">• Modalidad:</span>
                  <span className={`font-black text-xs ${
                    ultimo_abono.observaciones?.includes('PAGADO ADELANTADO')
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-yellow-300'
                  }`}>
                    {ultimo_abono.observaciones?.includes('PAGADO ADELANTADO')
                      ? `🟢 Pagado Adelantado ($${ultimo_abono.monto?.toLocaleString()} COP)`
                      : `🟡 Paga al Vencer ($${ultimo_abono.monto?.toLocaleString()} COP)`}
                  </span>
                </div>

                {/* Conteo de Días */}
                {abono_vigente ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/40 rounded-xl p-2.5 flex flex-col gap-1.5 text-xs mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-800 dark:text-emerald-300 font-bold">
                        • 🗓️ Lleva <strong className="font-black">{dias_transcurridos + 1}</strong> de <strong className="font-black">{totalDiasPeriodo}</strong> días
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-black">
                        ⏳ Quedan {dias_restantes} días
                      </span>
                    </div>
                    {/* Barra de progreso */}
                    <div className="w-full bg-emerald-200 dark:bg-emerald-900/60 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${porcentajeDias}%` }}></div>
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 text-right font-bold">
                      {ultimo_abono.observaciones?.includes('PAGADO ADELANTADO') ? 'Vence el' : 'Cobrar el'} {format(parseISO(ultimo_abono.fecha_fin), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                ) : (
                  <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs mt-1">
                    <span className="text-rose-800 dark:text-rose-300 font-bold">
                      • ⚠️ Vencido el {format(parseISO(ultimo_abono.fecha_fin), 'dd MMM yyyy', { locale: es })}
                    </span>
                    <span className="text-rose-700 dark:text-rose-400 font-black">
                      Lleva {dias_vencido} días vencido
                    </span>
                  </div>
                )}

              </div>
            ) : (
              /* Sin abonos previos */
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">• Estado del Plan:</span>
                  <span className="font-black text-amber-700 dark:text-amber-400">Sin plan activado</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">• Conteo de Días:</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">0 días (Sin iniciar)</span>
                </div>
                <button
                  onClick={onAbrirAbono}
                  className="btn-success py-2 px-3 text-xs font-black mt-1 w-full"
                >
                  <span>🗓️</span> Activar Plan Quincena ($7.000) o Mes ($14.000)
                </button>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Moto no registrada */
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm block">
              Esta placa no se encuentra entre las Motos Registradas
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Puedes registrarla ahora con su dueño y abono, o darle ingreso como Visitante por Día ($700).
            </p>
          </div>
          <button
            onClick={onRegistrar}
            className="btn-primary py-3 px-5 text-xs sm:text-sm font-black shrink-0 w-full sm:w-auto shadow-md"
          >
            <span>➕</span> Registrar Moto Ahora
          </button>
        </div>
      )}

      {/* 4. DETALLE DE INGRESO ACTUAL O PAGO DIARIO REGISTRADO */}
      {resultado.pago_diario_hoy ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                PAGO DIARIO AL DÍA ($700 COP)
              </span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block mt-0.5">
                • Registró su pago hoy a las {format(parseISO(resultado.entrada_hoy.hora_entrada), 'hh:mm a', { locale: es })}
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block mt-0.5">
                Trabajador con pago diario cubierto. No es necesario registrar hora de salida.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onVerTicket && (
              <button
                onClick={() => onVerTicket(resultado.entrada_hoy)}
                className="btn-secondary py-2.5 px-4 text-xs font-black shrink-0"
              >
                <span>🎟️</span> Tiquete
              </button>
            )}
            {resultado.entrada_activa && (
              <button
                onClick={() => onSalida(resultado.entrada_activa.id, 0, resultado.entrada_activa)}
                disabled={cargando}
                className="btn-secondary py-2.5 px-4 text-xs font-bold shrink-0 text-slate-500 hover:text-slate-700"
              >
                Salida Opcional
              </button>
            )}
          </div>
        </div>
      ) : estaAdentro && (
        <div className="bg-sky-50 dark:bg-sky-950/40 border-2 border-sky-300 dark:border-sky-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⏱️</span>
            <div>
              <span className="text-[10px] font-black text-sky-700 dark:text-sky-400 uppercase tracking-wider block">
                DETALLE DE INGRESO ACTUAL EN PARQUEADERO
              </span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block mt-0.5">
                • Hora de entrada: Ingresó hoy a las {format(parseISO(entrada_activa.hora_entrada), 'hh:mm a', { locale: es })} ({tiempoPermanencia()} adentro)
              </span>
              {entrada_activa.cobro_extra > 0 ? (
                <span className="badge badge-warning text-[10px] mt-1 font-black">
                  Tarifa {entrada_activa.cobro_extra === 3500 ? 'Semanal' : 'Día'}: Cobro de ${entrada_activa.cobro_extra.toLocaleString()} COP al salir
                </span>
              ) : (
                <span className="badge badge-success text-[10px] mt-1 font-black">
                  Cubierto por Abono (Sin cobro al salir)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onVerTicket && (
              <button
                onClick={() => onVerTicket(entrada_activa)}
                className="btn-secondary py-3.5 px-4 text-xs font-black shrink-0"
                title="Ver e Imprimir Tiquete de Entrada"
              >
                <span>🎟️</span> Tiquete
              </button>
            )}
            <button
              onClick={() => onSalida(entrada_activa.id, entrada_activa.cobro_extra, entrada_activa)}
              disabled={cargando}
              className="btn-danger py-3.5 px-6 text-sm font-black flex-1 sm:flex-initial shadow-md"
            >
              <span>⬅️</span> {entrada_activa.cobro_extra > 0 ? `Cobrar $${entrada_activa.cobro_extra.toLocaleString()} y Salir` : 'Registrar Salida'}
            </button>
          </div>
        </div>
      )}

      {/* 5. BOTONES DE ACCIÓN DE ENTRADA (SI NO ESTÁ ADENTRO Y NO HA PAGADO EL DÍA) */}
      {!estaAdentro && !resultado.pago_diario_hoy && (
        <div className="flex flex-col gap-3 pt-2">
          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center sm:text-left">
            Selecciona el Tipo de Ingreso al Parqueadero:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Opción 1: Trabajador con Abono */}
            <button
              onClick={() => onEntradaAbono(moto?.id)}
              disabled={cargando || !moto || !abono_vigente}
              className={`py-3.5 px-4 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all duration-200 ${
                abono_vigente
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/50 shadow-md active:scale-[0.98]'
                  : 'bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🟢</span>
                <span className="font-extrabold text-sm block leading-tight">
                  Abono Vigente
                </span>
              </div>
              <span className="text-[10px] font-medium opacity-90 block">
                {abono_vigente ? 'Trabajador Fijo ($0 extra)' : 'Requiere Plan Activo'}
              </span>
            </button>

            {/* Opción 2: Pago Diario ($700) */}
            <button
              onClick={() => onEntradaDia(placa, moto?.id)}
              disabled={cargando}
              className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 active:scale-[0.98] text-slate-950 font-black py-3.5 px-4 rounded-2xl border border-yellow-400/50 shadow-md text-left flex flex-col justify-between gap-2 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🟡</span>
                  <span className="font-black text-sm block leading-tight">
                    Pago Diario ($700)
                  </span>
                </div>
                <span className="font-black text-xs bg-slate-950 text-yellow-300 px-2 py-0.5 rounded-lg">
                  $700
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-900/80 block">
                Cancela el día (Sin salida)
              </span>
            </button>

            {/* Opción 3: Temporal Semanal ($3.500) */}
            <button
              onClick={() => onEntradaSemana ? onEntradaSemana(placa, moto?.id) : onEntradaDia(placa, moto?.id, 3500)}
              disabled={cargando}
              className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] text-white font-black py-3.5 px-4 rounded-2xl border border-purple-400/50 shadow-md text-left flex flex-col justify-between gap-2 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🟣</span>
                  <span className="font-black text-sm block leading-tight">
                    Semanal (7 Días)
                  </span>
                </div>
                <span className="font-black text-xs bg-slate-950/80 text-purple-300 px-2 py-0.5 rounded-lg border border-purple-400/40">
                  $3.500
                </span>
              </div>
              <span className="text-[10px] font-medium text-purple-200/90 block">
                Contratistas / 1 semana
              </span>
            </button>

          </div>
        </div>
      )}

    </div>
  );
}