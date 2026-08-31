const { supabase } = require('../db/supabase');

// POST /api/placas/detectar-ia  — Recibe { imagenBase64: "data:image/jpeg;base64,..." }
const detectarIA = async (req, res) => {
  const { imagenBase64 } = req.body;
  if (!imagenBase64) return res.status(400).json({ error: 'Se requiere imagenBase64' });

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!geminiKey) {
    return res.status(200).json({
      exito: false,
      necesitaKey: true,
      mensaje: 'Falta GEMINI_API_KEY en backend/.env',
    });
  }

  try {
    const base64Data = imagenBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeMatch = imagenBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    // Modelos activos con cuota amplia y alta velocidad
    const MODELOS = [
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite'
    ];

    const PROMPT = 'Lee la placa colombiana en la imagen (3 letras + 2 numeros + 1 letra, ej: SGV40F). Devuelve SOLO los 6 caracteres en mayusculas sin espacios. Si no hay placa responde NONE.';

    const payload = {
      contents: [{
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType, data: base64Data } }
        ]
      }],
      generationConfig: { maxOutputTokens: 10, temperature: 0, topK: 1 }
    };

    let placaEncontrada = '';
    let ultimoError = null;

    for (const m of MODELOS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await resp.json();

        if (resp.ok) {
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text
            ?.trim()?.toUpperCase()?.replace(/[^A-Z0-9]/g, '');

          if (raw && raw !== 'NONE' && raw.length >= 5) {
            placaEncontrada = raw.slice(0, 6);
            console.log(`⚡ [IA GEMINI (${m})] Placa detectada:`, placaEncontrada);
            break;
          }
        } else {
          ultimoError = data.error?.message || JSON.stringify(data);
          console.warn(`[Gemini (${m})] Falló o sin cuota:`, ultimoError);
        }
      } catch (err) {
        ultimoError = err.message;
      }
    }

    if (placaEncontrada) {
      return res.json({ exito: true, placa: placaEncontrada, metodo: 'ia_vision' });
    } else {
      return res.json({ exito: false, mensaje: 'No se pudo leer la placa con IA. Intenta enfocarla mejor.', error: ultimoError });
    }
  } catch (error) {
    console.error('Error en detección IA:', error);
    return res.status(500).json({ exito: false, error: error.message });
  }
};

// POST /api/placas/buscar  —  recibe { placa: "ABC123" }
const buscar = async (req, res) => {
  const { placa } = req.body;
  if (!placa) return res.status(400).json({ error: 'Placa requerida' });

  const placaUpper = placa.toUpperCase().replace(/\s/g, '');

  // 1. Buscar moto registrada
  const { data: moto, error: motoError } = await supabase
    .from('motos')
    .select('*')
    .eq('placa', placaUpper)
    .maybeSingle();

  if (motoError || !moto) {
    return res.json({
      encontrada: false,
      placa: placaUpper,
      moto: null,
      abono: null,
      abono_vigente: false,
      alarma: false,
      mensaje_alarma: '',
      entrada_activa: null
    });
  }

  // 2. Buscar el último abono de esta moto
  const { data: ultimosAbonos } = await supabase
    .from('abonos')
    .select('*')
    .eq('moto_id', moto.id)
    .order('fecha_fin', { ascending: false })
    .limit(1);

  const ultimoAbono = ultimosAbonos?.[0] || null;
  if (ultimoAbono && ultimoAbono.observaciones && ultimoAbono.observaciones.includes('SEMANAL')) {
    ultimoAbono.tipo = 'semanal';
  }
  const hoyStr = new Date().toISOString().slice(0, 10);
  const hoyDate = new Date(hoyStr);

  let abonoVigente = false;
  let alarma = false;
  let mensajeAlarma = '';
  let diasRestantes = 0;
  let diasTranscurridos = 0;
  let diasVencido = 0;

  if (ultimoAbono) {
    const finDate = new Date(ultimoAbono.fecha_fin);
    const inicioDate = new Date(ultimoAbono.fecha_inicio);
    const msPorDia = 1000 * 60 * 60 * 24;

    diasTranscurridos = Math.max(0, Math.floor((hoyDate - inicioDate) / msPorDia));
    
    if (finDate >= hoyDate) {
      abonoVigente = true;
      diasRestantes = Math.ceil((finDate - hoyDate) / msPorDia);
      if (diasRestantes <= 2) {
        mensajeAlarma = `⏳ Aviso: El abono vence pronto (le quedan ${diasRestantes} días).`;
      }
    } else {
      // SOLO aquí salta la alarma roja: cuando cumplió los 15 o 30 días y está vencido
      abonoVigente = false;
      alarma = true;
      diasVencido = Math.ceil((hoyDate - finDate) / msPorDia);
      mensajeAlarma = `🚨 ALARMA: Abono ${ultimoAbono.tipo.toUpperCase()} VENCIDO hace ${diasVencido} días (Cumplió su período el ${ultimoAbono.fecha_fin}). Cobrar renovación ($${ultimoAbono.tipo === 'quincenal' ? '7.000' : '14.000'}).`;
    }
  } else {
    // Si apenas se registró o no tiene abono previo: NO es alarma de vencimiento, es solo estado pendiente
    abonoVigente = false;
    alarma = false;
    mensajeAlarma = '';
  }

  // 3. Verificar si registró entrada hoy o está actualmente adentro
  const { data: entrada_activa } = await supabase
    .from('entradas')
    .select('*')
    .eq('moto_id', moto.id)
    .is('hora_salida', null)
    .maybeSingle();

  const { data: entrada_hoy } = await supabase
    .from('entradas')
    .select('*')
    .eq('moto_id', moto.id)
    .gte('hora_entrada', `${hoyStr}T00:00:00`)
    .lte('hora_entrada', `${hoyStr}T23:59:59`)
    .order('hora_entrada', { ascending: false })
    .limit(1)
    .maybeSingle();

  res.json({
    encontrada: true,
    placa: placaUpper,
    moto,
    abono: ultimoAbono,
    ultimo_abono: ultimoAbono,
    abono_vigente: abonoVigente,
    alarma: alarma,
    mensaje_alarma: mensajeAlarma,
    dias_transcurridos: diasTranscurridos,
    dias_restantes: diasRestantes,
    dias_vencido: diasVencido,
    detalles_abono: {
      tipo: ultimoAbono?.tipo || 'Sin abono',
      fecha_pago: ultimoAbono?.fecha_inicio || null,
      fecha_vence: ultimoAbono?.fecha_fin || null,
      monto: ultimoAbono?.monto || 0,
      dias_transcurridos: diasTranscurridos,
      dias_restantes: diasRestantes,
      dias_vencido: diasVencido
    },
    entrada_activa: entrada_activa || null,
    entrada_hoy: entrada_hoy || null,
    pago_diario_hoy: Boolean(entrada_hoy),
  });
};

module.exports = { buscar, detectarIA };