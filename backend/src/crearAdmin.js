require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabase } = require('./db/supabase');

async function crearAdmin() {
  const nombre = 'Admin';
  const email = 'admin@parqueadero.com';
  const password = '1234';

  const { data: existe } = await supabase.from('usuarios').select('id').eq('email', email).maybeSingle();
  if (existe) {
    console.log('✅ El usuario ya existe:');
    console.log('📧 Email:', email);
    console.log('🔑 Clave:', password);
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const { error } = await supabase.from('usuarios').insert([{ nombre, email, password_hash }]);

  if (error) {
    console.error('❌ Error al crear usuario:', error.message);
  } else {
    console.log('🎉 Usuario creado con éxito en Supabase:');
    console.log('📧 Email:', email);
    console.log('🔑 Clave:', password);
  }
}

crearAdmin();