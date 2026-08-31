import { format, parseISO, differenceInDays, isPast } from 'date-fns';
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
  if (!resultado) return null;

  const {
    placa,
    moto,
    abono,
    ultimo_abono,
    abono_vigente,
    alarma,
    mensaje_alarma,
    entrada_activa,
    dias_transcurridos,
    dias_restantes,
    dias_vencido,
  } = resultado;

  const estaAdentro = Boolean(entrada_activa);

  // Modalidad del trabajador (si tiene registrada en moto o deducida del abono)
  const modalidadTrabajador = moto?.modalidad_pago || (ultimo_abono ? ultimo_abono.tipo : 'diario');

  // Cálculo de tiempo transcurrido adentro (si aplica)
  const tiempoPermanencia = () => {
    if (!entrada_activa?.hora_entrada) return '';
    try {
      const entrada = new Date(entrada_activa.hora_entrada);
      const ahora = new Date();
      const diffMs = ahora - entrada;
      const diffMin = Math.floor(diffMs / 60000);
      const horas = Math.floor(diffMin / 60);
      const minutos = diffMin % 60;
      if (horas === 0) return `${minutos} min`;
      return `${horas} h ${minutos} min`;
    } catch {
      return '';
    }
  };

  const fechaHoraPago = () => {
    if (!ultimo_abono) return '—';
    const ts = ultimo_abono.hora_pago || ultimo_abono.created_at || ultimo_abono.fecha_inicio;
    try {
      const d = new Date(ts);
      return `${format(d, "dd 'de' MMM yyyy", { locale: es })} (${format(d, 'hh:mm a', { locale: es })})`;
    } catch {
      return ultimo_abono.fecha_inicio;
    }
  };

  return (
    <div className="card p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-5 animate-in fade-in duration-300">
      
      {/* 1. HEADER: PLACA & BADGES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="placa-colombiana font-mono text-2xl sm:text-3xl px-4 py-1.5 rounded-2xl font-black shadow-md">
            {placa}
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              ESTADO DEL TRABAJADOR
            </span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
              {moto ? moto.propietario : 'Moto No Registrada'}
            </span>
          </div>
        </div>

        {/* Status Pill Suscripción & Botón Pagar en cualquier momento */}
        <div className="flex items-center gap-2 flex-wrap">
          {moto ? (
            abono_vigente ? (
              <span className="badge badge-success text-xs py-2 px-3.5 font-black">
                🟢 PLAN AL DÍA
              </span>
            ) : ultimo_abono ? (
              <span className="badge badge-danger text-xs py-2 px-3.5 font-black animate-pulse">
                🚨 PERÍODO VENCIDO
              </span>
            ) : (
              <span className="badge badge-warning text-xs py-2 px-3.5 font-black">
                🟡 MODALIDAD {modalidadTrabajador.toUpperCase()}
              </span>
            )
          ) : (
            <span className="badge badge-neutral text-xs py-2 px-3.5 font-black">
              ⚪ NO REGISTRADA
            </span>
          )}

          {/* BOTÓN FLEXIBLE: Pagar / Renovar Quincena o Mes en CUALQUIER MOMENTO */}
          {moto && (
            <button
              onClick={onAbrirAbono}
              className="btn-success text-xs font-black py-2 px-3.5 shadow-md flex items-center gap-1.5"
              title="Registrar pago de quincena o mes en cualquier momento"
            >
              <span>💳</span> Pagar / Renovar Quincena o Mes
            </button>
          )}
        </div>
      </div>

      {/* 2. ALARMA DESTACADA SI ESTÁ VENCIDO */}
      {alarma && (
        <div className="bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-400 dark:border-rose-500 text-rose-900 dark:text-rose-200 p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-start sm:items-center gap-3">
            <span className="text-3xl shrink-0">🚨</span>
            <div>
              <span className="font-black text-rose-800 dark:text-rose-100 text-sm sm:text-base block">
                ¡AVISO — PERÍODO CUMPLIDO!
              </span>
              <p className="text-xs text-rose-700 dark:text-rose-200/90 mt-0.5 leading-relaxed font-semibold">
                {mensaje_alarma}
              </p>
            </div>
          </div>

          <button
            onClick={onAbrirAbono}
            className="btn-success py-2.5 px-4 text-xs font-black shrink-0 w-full sm:w-auto shadow-md"
          >
            <span>💳</span> Registrar Pago Ahora
          </button>
        </div>
      )}

      {/* 3. RESUMEN ESTRUCTURADO DE DATOS (PROPIETARIO + ABONO/MODALIDAD) */}
      {moto ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Datos Propietario y Moto */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>👤</span> DATOS DEL TRABAJADOR Y MOTO
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

              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 font-bold">• Modalidad Asignada:</span>
                <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 uppercase">
                  {modalidadTrabajador === 'diario' && '🟡 Pago Diario ($700/día)'}
                  {modalidadTrabajador === 'semanal' && '🟣 Semanal ($3.500/sem)'}
                  {modalidadTrabajador === 'quincenal' && '🗓️ Quincenal ($7.000)'}
                  {modalidadTrabajador === 'mensual' && '📅 Mensual ($14.000)'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Detalle de Modalidad / Conteo de Días */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>📋</span> ESTADO DEL PLAN / ESTIMADO
              </span>
              <span className={`badge text-[9px] ${
                modalidadTrabajador === 'diario' || modalidadTrabajador === 'semanal'
                  ? 'badge-info'
                  : abono_vigente ? 'badge-success' : 'badge-danger'
              }`}>
                {modalidadTrabajador === 'diario' ? 'Auditoría Diaria' : modalidadTrabajador === 'semanal' ? 'Auditoría Semanal' : (abono_vigente ? 'Al Día' : 'Vencido')}
              </span>
            </div>

            {ultimo_abono ? (
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">• Duración del Plan:</span>
                  <span className="font-black text-slate-900 dark:text-slate-100 capitalize">
                    {ultimo_abono.tipo === 'mensual' ? '📅 Mensual (30 días)' : ultimo_abono.tipo === 'semanal' ? '🟣 Semanal (7 días)' : '🗓️ Quincenal (15 días)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">• 🕐 Inicio del Período:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{fechaHoraPago()}</span>
                </div>

                {abono_vigente ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/40 rounded-xl p-2.5 flex flex-col gap-1.5 text-xs mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">Días Transcurridos:</span>
                      <span className="font-black text-emerald-800 dark:text-emerald-200 font-mono">Día {dias_transcurridos || 1}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">Días Restantes:</span>
                      <span className="font-black text-emerald-800 dark:text-emerald-200 font-mono">{dias_restantes} días</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs mt-1">
                    <span className="text-rose-700 dark:text-rose-300 font-bold">Días Vencido:</span>
                    <span className="font-black text-rose-800 dark:text-rose-200 font-mono">{dias_vencido} días</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col justify-center gap-2 text-xs py-2 text-slate-600 dark:text-slate-300">
                <p className="font-medium">
                  {modalidadTrabajador === 'diario'
                    ? '💡 Trabajador con pago diario ($700). Cada ingreso se contabiliza automáticamente en el reporte de la oficina.'
                    : '💡 Modalidad semanal ($3.500). Auditoría calculada automáticamente por semana.'}
                </p>
                <p className="text-[11px] text-slate-400 font-bold">
                  No requiere cobros manuales en portería ni registro de salida.
                </p>
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
              Regístrala con su nombre de trabajador y modalidad (Diario, Semanal, Quincenal o Mensual).
            </p>
          </div>
          <button
            onClick={onRegistrar}
            className="btn-primary py-3 px-5 text-xs sm:text-sm font-black shrink-0 w-full sm:w-auto shadow-md"
          >
            <span>✍️</span> Registrar Trabajador / Moto
          </button>
        </div>
      )}

      {/* 4. INGRESO REGISTRADO HOY */}
      {resultado.pago_diario_hoy && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                INGRESO DE HOY REGISTRADO EN SISTEMA
              </span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block mt-0.5">
                • Registró su entrada hoy a las {format(parseISO(resultado.entrada_hoy.hora_entrada), 'hh:mm a', { locale: es })}
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block mt-0.5">
                Contabilizado para el reporte y auditoría de oficina. No requiere registrar salida.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. BOTÓN PRINCIPAL DE INGRESO (SI NO HA INGRESADO HOY) */}
      {!resultado.pago_diario_hoy && (
        <div className="flex flex-col gap-3 pt-2">
          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center sm:text-left">
            Registrar Ingreso al Parqueadero:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Opción 1: Registrar Entrada Inmediata */}
            <button
              onClick={() => {
                if (modalidadTrabajador === 'semanal') {
                  onEntradaSemana ? onEntradaSemana(placa, moto?.id) : onEntradaDia(placa, moto?.id, 3500);
                } else if (modalidadTrabajador === 'quincenal' || modalidadTrabajador === 'mensual') {
                  if (abono_vigente) {
                    onEntradaAbono(moto?.id);
                  } else {
                    onEntradaDia(placa, moto?.id);
                  }
                } else {
                  onEntradaDia(placa, moto?.id);
                }
              }}
              disabled={cargando}
              className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-black py-4 px-5 rounded-2xl border border-emerald-400/50 shadow-lg flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div className="text-left">
                  <span className="font-black text-base block leading-tight">
                    Registrar Ingreso
                  </span>
                  <span className="text-[11px] font-medium text-emerald-100/90 block mt-0.5">
                    {moto ? `${moto.propietario} (${modalidadTrabajador.toUpperCase()})` : 'Ingreso inmediato'}
                  </span>
                </div>
              </div>
              <span className="font-bold text-sm bg-white/20 px-3 py-1 rounded-xl">
                Permitir Paso →
              </span>
            </button>

            {/* Opción 2: Pagar / Renovar Quincena o Mes */}
            <button
              onClick={onAbrirAbono}
              className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:scale-[0.98] text-white font-black py-4 px-5 rounded-2xl border border-sky-400/50 shadow-lg flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💳</span>
                <div className="text-left">
                  <span className="font-black text-base block leading-tight">
                    Pagar / Renovar Plan
                  </span>
                  <span className="text-[11px] font-medium text-sky-100/90 block mt-0.5">
                    Quincena ($7.000) o Mes ($14.000)
                  </span>
                </div>
              </div>
              <span className="font-bold text-xs bg-white/20 px-2.5 py-1 rounded-xl">
                Flexible
              </span>
            </button>

          </div>
        </div>
      )}

    </div>
  );
}