const { supabase } = require('../db/supabase');

// GET /api/motos
const listar = async (req, res) => {
  const { search } = req.query;
  let query = supabase.from('motos').select('*').order('created_at', { ascending: false });
  
  if (search && search.trim()) {
    const s = search.trim();
    query = query.or(`placa.ilike.%${s}%,propietario.ilike.%${s}%,marca.ilike.%${s}%,modelo.ilike.%${s}%`);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error('Error listando motos:', error);
    return res.status(500).json({ error: error.message });
  }
  res.json(data || []);
};

// GET /api/motos/:id
const obtener = async (req, res) => {
  const { data, error } = await supabase
    .from('motos').select('*, abonos(*)').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Moto no encontrada' });
  res.json(data);
};

// POST /api/motos
const crear = async (req, res) => {
  const { placa, propietario, telefono, marca, modelo, modalidad_pago } = req.body;
  if (!placa || !propietario) return res.status(400).json({ error: 'Placa y propietario son requeridos' });

  const placaUpper = placa.toUpperCase().replace(/\s/g, '');

  const { data: existe } = await supabase.from('motos').select('id').eq('placa', placaUpper).maybeSingle();
  if (existe) {
    // Si ya existe la placa, actualizar con los nuevos datos (UPSERT transparente)
    const updateData = { propietario, telefono, marca, modelo };
    if (modalidad_pago) updateData.modalidad_pago = modalidad_pago;

    let { data: updData, error: updErr } = await supabase
      .from('motos')
      .update(updateData)
      .eq('id', existe.id)
      .select()
      .single();

    if (updErr && updErr.message.includes('modalidad_pago')) {
      delete updateData.modalidad_pago;
      const { data: d2, error: e2 } = await supabase
        .from('motos')
        .update(updateData)
        .eq('id', existe.id)
        .select()
        .single();
      if (e2) return res.status(500).json({ error: e2.message });
      return res.status(200).json(d2);
    }

    if (updErr) return res.status(500).json({ error: updErr.message });
    return res.status(200).json(updData);
  }

  const insertData = { placa: placaUpper, propietario, telefono, marca, modelo };
  if (modalidad_pago) insertData.modalidad_pago = modalidad_pago;

  let { data, error } = await supabase
    .from('motos').insert([insertData])
    .select().single();

  if (error && error.message.includes('modalidad_pago')) {
    // Si la columna modalidad_pago aún no existe en la tabla, insertar sin ella
    delete insertData.modalidad_pago;
    const { data: d2, error: e2 } = await supabase
      .from('motos').insert([insertData])
      .select().single();
    if (e2) return res.status(500).json({ error: e2.message });
    return res.status(201).json(d2);
  }

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

// PUT /api/motos/:id
const actualizar = async (req, res) => {
  const { placa, propietario, telefono, marca, modelo, modalidad_pago } = req.body;
  const updateData = {};
  if (propietario !== undefined) updateData.propietario = propietario;
  if (telefono !== undefined) updateData.telefono = telefono;
  if (marca !== undefined) updateData.marca = marca;
  if (modelo !== undefined) updateData.modelo = modelo;
  if (modalidad_pago !== undefined) updateData.modalidad_pago = modalidad_pago;
  if (placa) updateData.placa = placa.toUpperCase().replace(/\s/g, '');

  let { data, error } = await supabase
    .from('motos').update(updateData)
    .eq('id', req.params.id).select().single();

  if (error && error.message.includes('modalidad_pago')) {
    delete updateData.modalidad_pago;
    const { data: d2, error: e2 } = await supabase
      .from('motos').update(updateData)
      .eq('id', req.params.id).select().single();
    if (e2) return res.status(500).json({ error: e2.message });
    return res.json(d2);
  }

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// DELETE /api/motos/:id
const eliminar = async (req, res) => {
  const { error } = await supabase.from('motos').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ mensaje: 'Moto eliminada correctamente' });
};

module.exports = { listar, obtener, crear, actualizar, eliminar };