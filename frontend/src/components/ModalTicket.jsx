import { format, parseISO, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ModalTicket({ entrada, tipo = 'entrada', onClose }) {
  if (!entrada) return null;

  const ahora = new Date();
  const fechaIngreso = entrada.hora_entrada ? parseISO(entrada.hora_entrada) : ahora;
  const fechaSalida = entrada.hora_salida ? parseISO(entrada.hora_salida) : ahora;

  const permanencia = () => {
    if (!entrada.hora_entrada) return '';
    const mins = differenceInMinutes(entrada.hora_salida ? fechaSalida : ahora, fechaIngreso);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} horas y ${m} min` : `${m} minutos`;
  };

  const tipoTexto = () => {
    if (entrada.cobro_extra === 700) return 'Visitante por Día ($700)';
    if (entrada.cobro_extra === 3500) return 'Temporal Semanal ($3.500)';
    if (entrada.cobro_extra > 0) return `Visitante ($${entrada.cobro_extra.toLocaleString()} COP)`;
    return 'Trabajador con Abono (Mensual/Quincenal)';
  };

  const imprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      
      {/* Contenedor del Ticket (Estilo Papel Térmico POS) */}
      <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 sm:p-7 border-2 border-slate-300 relative flex flex-col gap-4 font-mono select-none">
        
        {/* Close Top Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 h-8 w-8 rounded-full flex items-center justify-center bg-slate-100 transition-colors text-xs font-sans print:hidden"
        >
          ✕
        </button>

        {/* PRINTABLE RECEIPT CONTENT */}
        <div id="recibo-imprimible" className="flex flex-col gap-3 text-center">
          
          {/* Header */}
          <div className="border-b-2 border-dashed border-slate-300 pb-3">
            <h2 className="font-black text-base text-slate-950 uppercase tracking-tight">
              FUNDACIÓN FUNDA AMIGA
            </h2>
            <p className="text-[11px] font-bold text-slate-600 uppercase mt-0.5">
              Parqueadero Cartón de Colombia
            </p>
            <span className="inline-block mt-2 px-3 py-1 bg-slate-950 text-white text-[10px] font-black uppercase rounded-md tracking-wider">
              {tipo === 'entrada' ? '🎟️ TIQUETE DE ENTRADA' : '🧾 COMPROBANTE DE SALIDA Y PAGO'}
            </span>
          </div>

          {/* Placa en Grande */}
          <div className="py-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              PLACA DEL VEHÍCULO
            </span>
            <div className="placa-colombiana inline-block font-mono text-3xl font-black text-slate-950 px-5 py-1.5 rounded-xl mt-1 tracking-[0.2em] shadow-sm">
              {entrada.motos?.placa || entrada.placa || 'MOTO'}
            </div>
            {entrada.motos?.propietario && (
              <p className="text-xs font-bold text-slate-700 mt-1">
                {entrada.motos.propietario}
              </p>
            )}
          </div>

          {/* Detalles de Fecha y Horas */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-left text-xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold">Fecha:</span>
              <span className="font-black text-slate-900">
                {format(fechaIngreso, 'dd/MM/yyyy')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold">Hora Entrada:</span>
              <span className="font-black text-emerald-700 text-sm">
                {format(fechaIngreso, 'hh:mm a', { locale: es })}
              </span>
            </div>

            {tipo === 'salida' && entrada.hora_salida && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Hora Salida:</span>
                  <span className="font-black text-slate-900">
                    {format(fechaSalida, 'hh:mm a', { locale: es })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Permanencia:</span>
                  <span className="font-black text-slate-800">
                    {permanencia()}
                  </span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
              <span className="text-slate-500 font-bold">Modalidad:</span>
              <span className="font-black text-slate-900 text-[11px]">
                {tipoTexto()}
              </span>
            </div>
          </div>

          {/* Tarifa Registrada */}
          <div className="border-2 border-slate-900 rounded-2xl p-3 bg-yellow-50 text-center">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block">
              {tipo === 'entrada' ? 'VALOR DE LA TARIFA REGISTRADA' : 'TOTAL REGISTRADO'}
            </span>
            <span className="text-2xl font-black text-slate-950 font-mono block mt-0.5">
              ${(entrada.cobro_extra || 0).toLocaleString()} COP
            </span>
          </div>

          {/* Footer Note */}
          <div className="border-t-2 border-dashed border-slate-300 pt-2 text-[10px] text-slate-500 font-bold leading-tight">
            <p>✅ Registro oficial de parqueadero — Fundación Funda Amiga (Cartón de Colombia).</p>
          </div>

        </div>

        {/* ACTION BUTTONS (Hidden when printing) */}
        <div className="flex gap-2 pt-2 print:hidden font-sans">
          <button
            onClick={imprimir}
            className="btn-primary flex-1 py-3 text-xs sm:text-sm font-black shadow-md"
          >
            <span>🖨️</span> Imprimir Ticket
          </button>
          <button
            onClick={onClose}
            className="btn-secondary py-3 px-5 text-xs sm:text-sm font-bold"
          >
            Listo / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}