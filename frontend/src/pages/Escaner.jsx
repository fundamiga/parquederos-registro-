import { useState } from 'react';
import CamaraScanner from '../components/CamaraScanner';
import ResultadoPlaca from '../components/ResultadoPlaca';
import ModalAbono from '../components/ModalAbono';
import ModalRegistroRapido from '../components/ModalRegistroRapido';
import ModalTicket from '../components/ModalTicket';
import { buscarPlaca } from '../services/placasService';
import { registrarEntrada, registrarSalida } from '../services/parqueaderoService';
import { useNavigate } from 'react-router-dom';

export default function Escaner() {
  const [placaInput, setPlacaInput] = useState('');
  const [resultado, setResultado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [showModalAbono, setShowModalAbono] = useState(false);
  const [showModalRegistro, setShowModalRegistro] = useState(false);
  
  // Tiquete POS
  const [ticketActual, setTicketActual] = useState(null);
  const [tipoTicket, setTipoTicket] = useState('entrada'); // 'entrada' o 'salida'

  const [motoParaEditar, setMotoParaEditar] = useState(null);
  const [planSeleccionado, setPlanSeleccionado] = useState('diario');

  const navigate = useNavigate();

  const buscar = async (placa) => {
    const p = (placa ?? placaInput).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!p) return;
    setPlacaInput(p);
    setBuscando(true);
    setResultado(null);
    setMensaje(null);
    try {
      const { data } = await buscarPlaca(p);
      setResultado(data);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al consultar placa en Supabase: ' + err.message });
    } finally {
      setBuscando(false);
    }
  };

  const handlePlacaDetectada = (placa) => {
    const p = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    setPlacaInput(p);
    setResultado(null);
    setMensaje({
      tipo: 'info',
      texto: `🎯 Placa detectada con IA: "${p}" — Consultando estado en el sistema...`,
    });
    buscar(p);
  };

  // Opción 1: Entrada con Abono (Trabajador Fijo)
  const handleEntradaAbono = async (moto_id) => {
    setCargando(true);
    try {
      const resp = await registrarEntrada({ moto_id, tipo_ingreso: 'abono' });
      setMensaje({ tipo: 'success', texto: '✅ ¡Entrada registrada bajo Modalidad de Abono!' });
      buscar(placaInput);
      // Abrir ticket informativo
      if (resp.data) {
        setTicketActual(resp.data);
        setTipoTicket('entrada');
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: '❌ ' + (err.response?.data?.error ?? err.message) });
    } finally {
      setCargando(false);
    }
  };

  // Opción 2: Entrada Pago Diario ($700 Fijo)
  const handleEntradaDia = async (placa, moto_id) => {
    // Si la moto no está registrada con nombre, abrir registro para pedir el nombre
    if (!moto_id) {
      setPlacaInput(placa);
      setMotoParaEditar(null);
      setPlanSeleccionado('diario');
      setShowModalRegistro(true);
      return;
    }

    setCargando(true);
    try {
      const resp = await registrarEntrada({
        moto_id: moto_id,
        placa: placa,
        tipo_ingreso: 'dia',
      });
      setMensaje({ tipo: 'success', texto: '🟡 ¡Pago Diario registrado exitosamente ($700 COP)!' });
      buscar(placaInput);
      if (resp.data) {
        setTicketActual(resp.data);
        setTipoTicket('entrada');
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: '❌ ' + (err.response?.data?.error ?? err.message) });
    } finally {
      setCargando(false);
    }
  };

  // Opción 3: Entrada Temporal Semanal ($3.500)
  const handleEntradaSemana = async (placa, moto_id) => {
    // Si la moto no está registrada con nombre, abrir registro para pedir el nombre
    if (!moto_id) {
      setPlacaInput(placa);
      setMotoParaEditar(null);
      setPlanSeleccionado('semanal');
      setShowModalRegistro(true);
      return;
    }

    setCargando(true);
    try {
      const resp = await registrarEntrada({
        moto_id: moto_id,
        placa: placa,
        tipo_ingreso: 'semana',
      });
      setMensaje({ tipo: 'success', texto: '🟣 ¡Ingreso Semanal registrado ($3.500 COP)!' });
      buscar(placaInput);
      if (resp.data) {
        setTicketActual(resp.data);
        setTipoTicket('entrada');
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: '❌ ' + (err.response?.data?.error ?? err.message) });
    } finally {
      setCargando(false);
    }
  };

  // Salida (Abono o Visitante)
  const handleSalida = async (entrada_id, cobro_extra, entradaData) => {
    setCargando(true);
    try {
      const resp = await registrarSalida(entrada_id, cobro_extra || 0);
      setMensaje({
        tipo: 'success',
        texto: cobro_extra > 0
          ? `✅ Salida registrada con éxito. Cobro realizado: $${cobro_extra.toLocaleString()} COP`
          : '✅ Salida registrada con éxito.',
      });
      buscar(placaInput);
      // Si hubo cobro, abrir comprobante de pago de salida
      if (resp.data) {
        setTicketActual(resp.data);
        setTipoTicket('salida');
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: '❌ ' + (err.response?.data?.error ?? err.message) });
    } finally {
      setCargando(false);
    }
  };

  const msgStyle = {
    success: 'bg-emerald-950/80 text-emerald-200 border-emerald-500/50 shadow-lg',
    error: 'bg-rose-950/80 text-rose-200 border-rose-500/50 shadow-lg',
    info: 'bg-sky-950/80 text-sky-200 border-sky-500/50 shadow-lg',
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 pb-28 md:pb-10 flex flex-col gap-5 sm:gap-6">
      
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-success text-[10px] sm:text-[11px] font-black">
              ⚡ Parqueadero Cartón de Colombia
            </span>
            <span className="text-xs text-slate-400 font-medium">Fundación Funda Amiga</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Control de Parqueadero
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Ingreso rápido: <span className="font-bold text-yellow-600 dark:text-yellow-400">Día ($700)</span>, <span className="font-bold text-purple-600 dark:text-purple-400">Semana ($3.500)</span> y <span className="font-bold text-emerald-600 dark:text-emerald-400">Abonos ($7.000 / $14.000)</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setMotoParaEditar(null);
              setShowModalRegistro(true);
            }}
            className="btn-secondary text-xs sm:text-sm font-bold py-2.5 px-3.5 flex items-center gap-1.5 shadow-xs hover:border-emerald-500/50"
            title="Registrar moto o trabajador de forma manual sin usar la cámara"
          >
            <span>✍️</span> Registrar Manual
          </button>
          <button
            onClick={() => navigate('/motos')}
            className="btn-secondary text-xs sm:text-sm font-bold py-2.5 px-4"
          >
            <span>🏍️</span> Motos Registradas
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left Col: Camera Scanner Viewport */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="card p-4 sm:p-5 bg-white dark:bg-slate-900/90 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span>📹</span> Visor de Captura IA
              </h2>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black">⚡ Gemini Vision</span>
            </div>
            <CamaraScanner onPlacaDetectada={handlePlacaDetectada} />
          </div>
        </div>

        {/* Right Col: Search & Manual Input */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="card p-5 bg-white dark:bg-slate-900/90 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span>🔍</span> Búsqueda Manual / Placa
                </h2>
                <button
                  onClick={() => {
                    setMotoParaEditar(null);
                    setShowModalRegistro(true);
                  }}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>✍️</span> Registrar Manual
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Escribe o confirma la placa:
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={placaInput}
                    onChange={(e) => {
                      setPlacaInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                      setResultado(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && buscar()}
                    placeholder="SGV40F"
                    maxLength={6}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded-2xl py-3.5 px-4 text-center font-mono text-2xl sm:text-3xl font-black tracking-[0.25em] text-slate-900 dark:text-yellow-300 shadow-inner focus:outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                  />

                  {placaInput && (
                    <button
                      onClick={() => {
                        setPlacaInput('');
                        setResultado(null);
                        setMensaje(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  onClick={() => buscar()}
                  disabled={buscando || !placaInput}
                  className="btn-primary py-3.5 text-base font-extrabold shadow-md w-full mt-1"
                >
                  {buscando ? (
                    <>
                      <span className="animate-spin text-lg">⚙️</span>
                      <span>Consultando Supabase...</span>
                    </>
                  ) : (
                    <>
                      <span>🔎</span>
                      <span>Consultar Placa</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setMotoParaEditar(null);
                    setShowModalRegistro(true);
                  }}
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-1.5 w-full bg-slate-50/50 dark:bg-slate-950/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20"
                >
                  <span>✍️</span> Registrar Moto / Trabajador Manual
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>💡 Formato moto: 3 letras + 2 núm + 1 letra</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">Ej: SGV40F</span>
            </div>
          </div>
        </div>

      </div>

      {/* Action Notification Alert */}
      {mensaje && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold border flex items-center justify-between gap-3 animate-in fade-in duration-200 ${msgStyle[mensaje.tipo]}`}>
          <span>{mensaje.texto}</span>
          <button onClick={() => setMensaje(null)} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
      )}

      {/* Result Card */}
      {resultado && (
        <ResultadoPlaca
          resultado={resultado}
          onEntradaAbono={handleEntradaAbono}
          onEntradaDia={handleEntradaDia}
          onEntradaSemana={handleEntradaSemana}
          onVerTicket={(entrada) => {
            setTicketActual(entrada);
            setTipoTicket('entrada');
          }}
          onEditarMoto={(moto) => {
            setMotoParaEditar(moto);
            setShowModalRegistro(true);
          }}
          onSalida={handleSalida}
          onRegistrar={() => {
            setMotoParaEditar(null);
            setShowModalRegistro(true);
          }}
          onAbrirAbono={() => setShowModalAbono(true)}
          cargando={cargando}
        />
      )}

      {/* Modal Ticket de Entrada / Salida POS */}
      {ticketActual && (
        <ModalTicket
          entrada={ticketActual}
          tipo={tipoTicket}
          onClose={() => setTicketActual(null)}
        />
      )}

      {/* Modal Registro Rápido / Edición */}
      {showModalRegistro && (
        <ModalRegistroRapido
          placaInicial={placaInput}
          motoInicial={motoParaEditar}
          planPorDefecto={planSeleccionado}
          onClose={() => {
            setShowModalRegistro(false);
            setMotoParaEditar(null);
          }}
          onMotoCreada={(placaCreada) => {
            setShowModalRegistro(false);
            setMotoParaEditar(null);
            setPlacaInput(placaCreada);
            buscar(placaCreada);
          }}
          onMotoActualizada={() => {
            setShowModalRegistro(false);
            setMotoParaEditar(null);
            buscar(placaInput);
          }}
        />
      )}

      {/* Modal Abono */}
      {showModalAbono && resultado?.moto && (
        <ModalAbono
          moto={resultado.moto}
          onClose={() => setShowModalAbono(false)}
          onCreado={() => {
            setShowModalAbono(false);
            buscar(placaInput);
          }}
        />
      )}

    </div>
  );
}