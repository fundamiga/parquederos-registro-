import { useRef, useState, useEffect } from 'react';
import { detectarPlacaIA } from '../services/placasService';

export default function CamaraScanner({ onPlacaDetectada }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const [activa, setActiva] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [estado, setEstado] = useState('');
  const [preview, setPreview] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (trasera) o 'user' (frontal)

  // Asegurar que la cámara se limpie al desmontar el componente
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const iniciarCamara = async (camMode = facingMode) => {
    try {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: camMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setActiva(true);
        setFacingMode(camMode);
      }
    } catch (err) {
      alert('No se pudo acceder a la cámara: ' + err.message);
    }
  };

  const alternarCamara = () => {
    const nuevoModo = facingMode === 'environment' ? 'user' : 'environment';
    iniciarCamara(nuevoModo);
  };

  const detenerCamara = () => {
    videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
    setActiva(false);
    setProcesando(false);
  };

  const procesarCanvas = async (canvasRecortado) => {
    setProcesando(true);
    setProgreso(30);
    setEstado('⚡ Optimizando imagen...');

    // Redimensionar para envío ultrarrápido (600px max)
    const MAX_W = 600;
    let canvasEnvio = canvasRecortado;
    if (canvasRecortado.width > MAX_W) {
      const scale = MAX_W / canvasRecortado.width;
      const small = document.createElement('canvas');
      small.width = MAX_W;
      small.height = Math.round(canvasRecortado.height * scale);
      small.getContext('2d').drawImage(canvasRecortado, 0, 0, small.width, small.height);
      canvasEnvio = small;
    }

    // Calidad 0.78 para peso < 25 KB (instantáneo en redes móviles)
    const dataUrl = canvasEnvio.toDataURL('image/jpeg', 0.78);
    setPreview(dataUrl);

    setProgreso(60);
    setEstado('🔍 Reconociendo placa...');

    try {
      // Timeout de seguridad de 5 segundos para que la app NUNCA se congele
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tiempo de espera agotado. Intenta de nuevo.')), 5000)
      );

      const respIA = await Promise.race([detectarPlacaIA(dataUrl), timeoutPromise]);

      if (respIA.data?.exito && respIA.data?.placa) {
        const placa = respIA.data.placa;
        console.log('⚡ [IA VISION] Placa detectada:', placa);
        setProgreso(100);
        setEstado('✅ ¡Placa detectada!');
        onPlacaDetectada(placa);
      } else {
        setEstado('❌ No se reconoció');
        alert(respIA.data?.mensaje || 'No se pudo leer la placa. Asegúrate de enfocar bien dentro del recuadro amarillo.');
      }
    } catch (iaErr) {
      setEstado('❌ Error o reintento');
      alert('Aviso: ' + (iaErr.message || 'Error de conexión. Intenta capturar nuevamente.'));
    } finally {
      // Auto-recuperación garantizada: el botón siempre vuelve a quedar disponible
      setProcesando(false);
    }
  };

  const capturar = async () => {
    if (!videoRef.current || procesando) return;
    const video = videoRef.current;
    const vW = video.videoWidth || 640;
    const vH = video.videoHeight || 480;

    // Recorte centrado exacto en la zona del visor (75% ancho x 45% alto)
    // Elimina el 60% de elementos innecesarios para que la IA lea en < 0.8s
    const cropW = Math.round(vW * 0.75);
    const cropH = Math.round(vH * 0.45);
    const cropX = Math.round((vW - cropW) / 2);
    const cropY = Math.round((vH - cropH) / 2);

    const canvas = canvasRef.current;
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    await procesarCanvas(canvas);
  };

  const handleArchivo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        await procesarCanvas(canvas);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-3.5">
      
      {/* HUD Camera Viewport */}
      <div className="relative bg-slate-950 rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-video w-full shadow-2xl border border-slate-800 ring-1 ring-slate-700/50">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        
        {/* State: Camera Off */}
        {!activa && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 p-6 text-center bg-gradient-to-b from-slate-900/95 via-slate-950/98 to-slate-950">
            <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-4xl shadow-lg shadow-emerald-950/50 animate-pulse">
              📷
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-100">Visor de Cámara Apagado</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                Activa la cámara del celular o sube una fotografía para escanear placas al instante con Inteligencia Artificial.
              </p>
            </div>
          </div>
        )}

        {/* State: Camera Active HUD Frame */}
        {activa && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
            
            {/* Target Box */}
            <div className="relative w-[85%] sm:w-[75%] h-[48%] sm:h-[42%] rounded-3xl border-2 border-yellow-400/90 shadow-2xl shadow-yellow-500/20 flex items-center justify-center bg-yellow-400/5 backdrop-blur-[0.5px]">
              
              {/* Glowing Corner Accents */}
              <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-yellow-400 rounded-tl-xl"></div>
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-yellow-400 rounded-tr-xl"></div>
              <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-yellow-400 rounded-bl-xl"></div>
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-yellow-400 rounded-br-xl"></div>

              {/* Laser Scan Animation Line */}
              {procesando ? (
                <div className="absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_16px_#34d399] animate-scan-line rounded-full"></div>
              ) : (
                <div className="absolute left-4 right-4 h-0.5 bg-yellow-400/30"></div>
              )}

              {/* Badge Centra Placa */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-950/95 text-yellow-300 text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-yellow-400/50 shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
                <span>CENTRA LA PLACA AQUÍ</span>
              </div>
            </div>

            {/* Mobile Controls Overlay */}
            <div className="absolute top-3 right-3 pointer-events-auto flex items-center gap-2">
              <button
                onClick={alternarCamara}
                className="h-10 w-10 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-700 text-white flex items-center justify-center text-lg shadow-md hover:bg-slate-900 active:scale-95 transition-all"
                title="Cambiar Cámara"
              >
                🔄
              </button>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Preview & Progress Pill */}
      {(procesando || preview) && (
        <div className="bg-slate-900/90 backdrop-blur-md text-white p-3.5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-3 animate-in fade-in duration-200">
          {preview && (
            <img
              src={preview}
              className="h-14 w-24 object-contain rounded-xl border-2 border-yellow-400/70 bg-slate-950 p-0.5 shrink-0"
              alt="recorte"
            />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-emerald-400 truncate flex items-center gap-1.5">
                {procesando && <span className="animate-spin text-sm">⚡</span>}
                <span>{estado || 'Procesando...'}</span>
              </span>
              <span className="font-mono text-slate-400 text-[11px]">{progreso}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Big Touch Controls for Mobile */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {!activa ? (
          <button
            onClick={() => iniciarCamara('environment')}
            disabled={procesando}
            className="btn-primary flex-1 py-4 text-base font-extrabold shadow-emerald-950/60"
          >
            <span className="text-xl">📹</span> Activar Cámara en Vivo
          </button>
        ) : (
          <div className="flex gap-2 w-full">
            <button
              onClick={capturar}
              disabled={procesando}
              className="btn-success flex-1 py-4 text-base sm:text-lg font-black shadow-emerald-950/60 animate-in fade-in"
            >
              <span className="text-2xl">📸</span> {procesando ? 'Leyendo IA...' : 'Capturar Placa'}
            </button>
            <button
              onClick={detenerCamara}
              disabled={procesando}
              className="btn-secondary px-4 py-4 text-sm"
              title="Apagar Cámara"
            >
              <span>⏹️</span>
            </button>
          </div>
        )}

        <button
          onClick={() => fileRef.current?.click()}
          disabled={procesando}
          className="btn-secondary py-3.5 sm:py-4 px-5 text-xs sm:text-sm font-bold shrink-0"
        >
          <span className="text-base">📁</span> Subir Foto
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleArchivo} className="hidden" />
      </div>

    </div>
  );
}