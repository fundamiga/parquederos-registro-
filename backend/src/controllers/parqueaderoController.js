const { supabase } = require('../db/supabase');

// GET /api/parqueadero/activos — motos actualmente dentro
const activos = async (req, res) => {
  const { data, error } = await supabase
    .from('entradas')
    .select('*, motos(placa, propietario, telefono, marca, modelo)')
    .is('hora_salida', null)
    .order('hora_entrada', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
};

// POST /api/parqueadero/entrada  — registrar ingreso (Abono o Visitante Día)
const registrarEntrada = async (req, res) => {
  let { moto_id, placa, propietario, tipo_ingreso } = req.body;
  tipo_ingreso = tipo_ingreso || 'abono';

  // Si no viene moto_id pero viene placa (ej: visitante nuevo)
  if (!moto_id && placa) {
    const placaUpper = placa.toUpperCase().replace(/\s/g, '');
    let { data: motoExistente } = await supabase.from('motos').select('id').eq('placa', placaUpper).maybeSingle();
    
    if (!motoExistente) {
      const { data: nuevaMoto, error: errCrea } = await supabase
        .from('motos')
        .insert([{
          placa: placaUpper,
          propietario: propietario || 'Visitante Ocasional',
          telefono: '',
          marca: '',
          modelo: ''
        }])
        .select('id')
        .single();
      
      if (errCrea) return res.status(500).json({ error: errCrea.message });
      moto_id = nuevaMoto.id;
    } else {
      moto_id = motoExistente.id;
    }
  }

  if (!moto_id) return res.status(400).json({ error: 'moto_id o placa requerido' });

  // Verificar si ya está adentro
  const { data: yaAdentro } = await supabase
    .from('entradas').select('id').eq('moto_id', moto_id).is('hora_salida', null).maybeSingle();
  if (yaAdentro) return res.status(409).json({ error: 'Esta moto ya se encuentra registrada adentro del parqueadero' });

  // Determinar cobro según tipo de ingreso
  let cobro = 0;
  if (tipo_ingreso === 'dia') cobro = 700;
  else if (tipo_ingreso === 'semana') cobro = 3500;
  else if (req.body.monto !== undefined) cobro = Number(req.body.monto);

  const { data, error } = await supabase
    .from('entradas')
    .insert([{
      moto_id,
      hora_entrada: new Date().toISOString(),
      cobro_extra: cobro
    }])
    .select('*, motos(placa, propietario, telefono, marca, modelo)').single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

// POST /api/parqueadero/salida  — registrar salida y fijar cobro
const registrarSalida = async (req, res) => {
  const { entrada_id, cobro_extra } = req.body;
  if (!entrada_id) return res.status(400).json({ error: 'entrada_id requerido' });

  const hora_salida = new Date().toISOString();

  // Obtener la entrada actual
  const { data: entradaActual } = await supabase
    .from('entradas')
    .select('*')
    .eq('id', entrada_id)
    .single();

  const cobroFinal = cobro_extra !== undefined && cobro_extra !== null
    ? cobro_extra
    : (entradaActual?.cobro_extra || 0);

  const { data, error } = await supabase
    .from('entradas')
    .update({ hora_salida, cobro_extra: cobroFinal })
    .eq('id', entrada_id)
    .is('hora_salida', null)
    .select('*, motos(placa, propietario)').single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Entrada no encontrada o ya tiene salida' });

  res.json(data);
};

// GET /api/parqueadero/historial — todos los registros
const historial = async (req, res) => {
  const { fecha } = req.query;
  let query = supabase
    .from('entradas')
    .select('*, motos(placa, propietario, telefono)')
    .order('hora_entrada', { ascending: false })
    .limit(150);

  if (fecha) {
    query = query.gte('hora_entrada', `${fecha}T00:00:00`).lte('hora_entrada', `${fecha}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
};

// GET /api/parqueadero/dashboard — estadísticas del día
const dashboard = async (req, res) => {
  const hoy = new Date().toISOString().slice(0, 10);

  try {
    const { data: entradas_hoy } = await supabase
      .from('entradas')
      .select('id, cobro_extra, hora_salida')
      .gte('hora_entrada', `${hoy}T00:00:00`)
      .lte('hora_entrada', `${hoy}T23:59:59`);

    const { data: activos } = await supabase
      .from('entradas').select('id').is('hora_salida', null);

    const total_entradas = entradas_hoy?.length || 0;
    const motos_adentro = activos?.length || 0;
    const recaudo_hoy = (entradas_hoy || []).reduce((acc, e) => acc + (Number(e.cobro_extra) || 0), 0);

    res.json({ total_entradas, motos_adentro, recaudo_hoy, fecha: hoy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/parqueadero/informe-diario?fecha=YYYY-MM-DD — Cierre de caja e informe diario
const informeDiario = async (req, res) => {
  const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);

  try {
    // 1. Obtener entradas del día
    const { data: entradas, error: errEntradas } = await supabase
      .from('entradas')
      .select('*, motos(placa, propietario, telefono, marca, modelo)')
      .gte('hora_entrada', `${fecha}T00:00:00`)
      .lte('hora_entrada', `${fecha}T23:59:59`)
      .order('hora_entrada', { ascending: true });

    if (errEntradas) return res.status(500).json({ error: errEntradas.message });

    // 2. Obtener abonos registrados en el día
    const { data: abonos, error: errAbonos } = await supabase
      .from('abonos')
      .select('*, motos(placa, propietario, telefono, marca, modelo)')
      .gte('created_at', `${fecha}T00:00:00`)
      .lte('created_at', `${fecha}T23:59:59`)
      .order('created_at', { ascending: true });

    if (errAbonos) return res.status(500).json({ error: errAbonos.message });

    // Separar entradas: Visitantes por Día ($700) vs Ingresos con Abono
    const visitantesDia = (entradas || []).filter(e => (Number(e.cobro_extra) || 0) > 0);
    const entradasAbonados = (entradas || []).filter(e => (Number(e.cobro_extra) || 0) === 0);

    // Totales financieros
    const totalRecaudoVisitantes = visitantesDia.reduce((acc, v) => acc + (Number(v.cobro_extra) || 0), 0);
    const totalRecaudoAbonos = (abonos || []).reduce((acc, a) => acc + (Number(a.monto) || 0), 0);
    const granTotalRecaudo = totalRecaudoVisitantes + totalRecaudoAbonos;

    res.json({
      fecha,
      totales: {
        total_visitantes: totalRecaudoVisitantes,
        total_abonos: totalRecaudoAbonos,
        gran_total: granTotalRecaudo,
        conteo_visitantes: visitantesDia.length,
        conteo_abonados_entradas: entradasAbonados.length,
        conteo_abonos_pagados: (abonos || []).length,
        conteo_total_motos: (entradas || []).length
      },
      visitantes_dia: visitantesDia,
      abonos_pagados: abonos || [],
      entradas_abonados: entradasAbonados
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { activos, registrarEntrada, registrarSalida, historial, dashboard, informeDiario };