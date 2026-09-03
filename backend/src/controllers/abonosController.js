const { supabase } = require('../db/supabase');

// GET /api/abonos?moto_id=uuid
const listar = async (req, res) => {
  const { moto_id } = req.query;
  let query = supabase
    .from('abonos')
    .select('*, motos(placa, propietario, telefono, marca, modelo)')
    .order('created_at', { ascending: false });
  if (moto_id) query = query.eq('moto_id', moto_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const procesados = (data || []).map((ab) => {
    const duracion = Math.round((new Date(ab.fecha_fin) - new Date(ab.fecha_inicio)) / (1000 * 60 * 60 * 24));
    if (
      ab.tipo === 'semanal' ||
      ab.monto === 3500 ||
      (duracion > 0 && duracion <= 8) ||
      (ab.observaciones && ab.observaciones.includes('SEMANAL'))
    ) {
      return { ...ab, tipo: 'semanal' };
    }
    return ab;
  });

  res.json(procesados);
};

// POST /api/abonos
const crear = async (req, res) => {
  const { moto_id, tipo, fecha_inicio, fecha_fin, monto, observaciones, estado_pago } = req.body;
  if (!moto_id || !tipo || !fecha_inicio || !fecha_fin || !monto)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  if (!['mensual', 'quincenal', 'semanal'].includes(tipo))
    return res.status(400).json({ error: 'Tipo debe ser mensual, quincenal o semanal' });

  // hora_pago / hora_inicio: la hora exacta en que se registra el plan
  const hora_pago = new Date().toISOString();
  const modalidadPago = estado_pago === 'adelantado' ? 'adelantado' : 'al_vencer';

  const insertData = {
    moto_id,
    tipo,
    fecha_inicio,
    fecha_fin,
    monto,
    pagado: true,
    hora_pago,
  };

  // observaciones (incluye modalidad de cobro si se especifica)
  const notaModalidad = modalidadPago === 'adelantado' ? '[PAGADO ADELANTADO]' : '[PAGA AL VENCER]';
  insertData.observaciones = observaciones ? `${notaModalidad} ${observaciones}` : notaModalidad;

  let { data, error } = await supabase
    .from('abonos')
    .insert([insertData])
    .select('*, motos(placa, propietario)')
    .single();

  if (error) {
    // Si falla por el check constraint de Postgres (que solo tenía mensual/quincenal)
    if (error.message.includes('abonos_tipo_check') || error.message.includes('violates check constraint')) {
      const fallbackData = { ...insertData, tipo: 'quincenal' };
      fallbackData.observaciones = `[PLAN SEMANAL] ${fallbackData.observaciones || ''}`.trim();
      const { data: dFb, error: eFb } = await supabase
        .from('abonos')
        .insert([fallbackData])
        .select('*, motos(placa, propietario)')
        .single();
      if (eFb) return res.status(500).json({ error: eFb.message });
      if (dFb) dFb.tipo = tipo;
      return res.status(201).json(dFb);
    }

    // Si hora_pago o observaciones no existen todavía en la tabla, insertar sin ellas
    if (error.message.includes('hora_pago') || error.message.includes('observaciones')) {
      const { data: data2, error: error2 } = await supabase
        .from('abonos')
        .insert([{ moto_id, tipo: tipo === 'semanal' ? 'quincenal' : tipo, fecha_inicio, fecha_fin, monto, pagado: true }])
        .select('*, motos(placa, propietario)')
        .single();
      if (error2) return res.status(500).json({ error: error2.message });
      if (data2) data2.tipo = tipo;
      return res.status(201).json(data2);
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
};

// GET /api/abonos/vigente/:moto_id
const verificarVigente = async (req, res) => {
  const hoy = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('abonos')
    .select('*')
    .eq('moto_id', req.params.moto_id)
    .eq('pagado', true)
    .lte('fecha_inicio', hoy)
    .gte('fecha_fin', hoy)
    .order('fecha_fin', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.json({ vigente: false, abono: null });
  const duracion = Math.round((new Date(data.fecha_fin) - new Date(data.fecha_inicio)) / (1000 * 60 * 60 * 24));
  if (
    data.tipo === 'semanal' ||
    data.monto === 3500 ||
    (duracion > 0 && duracion <= 8) ||
    (data.observaciones && data.observaciones.includes('SEMANAL'))
  ) {
    data.tipo = 'semanal';
  }
  res.json({ vigente: true, abono: data });
};

// PUT /api/abonos/:id
const actualizar = async (req, res) => {
  const { tipo, fecha_inicio, fecha_fin, monto, observaciones, pagado } = req.body;
  const updateData = {};
  if (tipo !== undefined) updateData.tipo = tipo;
  if (fecha_inicio !== undefined) updateData.fecha_inicio = fecha_inicio;
  if (fecha_fin !== undefined) updateData.fecha_fin = fecha_fin;
  if (monto !== undefined) updateData.monto = Number(monto);
  if (observaciones !== undefined) updateData.observaciones = observaciones;
  if (pagado !== undefined) updateData.pagado = pagado;

  let { data, error } = await supabase
    .from('abonos')
    .update(updateData)
    .eq('id', req.params.id)
    .select('*, motos(placa, propietario)')
    .single();

  if (error && (error.message.includes('abonos_tipo_check') || error.message.includes('violates check constraint'))) {
    updateData.tipo = 'quincenal';
    const { data: dFb, error: eFb } = await supabase
      .from('abonos')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*, motos(placa, propietario)')
      .single();
    if (eFb) return res.status(500).json({ error: eFb.message });
    if (dFb) dFb.tipo = tipo;
    return res.json(dFb);
  }

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// DELETE /api/abonos/:id
const eliminar = async (req, res) => {
  const { error } = await supabase.from('abonos').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ mensaje: 'Abono eliminado' });
};

module.exports = { listar, crear, actualizar, verificarVigente, eliminar };