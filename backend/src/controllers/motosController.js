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
  const { placa, propietario, telefono, marca, modelo } = req.body;
  if (!placa || !propietario) return res.status(400).json({ error: 'Placa y propietario son requeridos' });

  const placaUpper = placa.toUpperCase().replace(/\s/g, '');

  const { data: existe } = await supabase.from('motos').select('id').eq('placa', placaUpper).maybeSingle();
  if (existe) return res.status(409).json({ error: 'Ya existe una moto con esa placa' });

  const { data, error } = await supabase
    .from('motos').insert([{ placa: placaUpper, propietario, telefono, marca, modelo }])
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

// PUT /api/motos/:id
const actualizar = async (req, res) => {
  const { propietario, telefono, marca, modelo } = req.body;
  const { data, error } = await supabase
    .from('motos').update({ propietario, telefono, marca, modelo })
    .eq('id', req.params.id).select().single();
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