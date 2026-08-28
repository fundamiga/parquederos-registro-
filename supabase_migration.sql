-- ============================================================
-- PlacaMoto — Script SQL para Supabase
-- Ejecutar en: Supabase > SQL Editor > New Query
-- ============================================================

-- Tabla de usuarios (operadores del parqueadero)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de motos registradas
CREATE TABLE IF NOT EXISTS motos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT UNIQUE NOT NULL,
  propietario TEXT NOT NULL,
  telefono TEXT,
  marca TEXT,
  modelo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de abonos (mensuales / quincenales)
CREATE TABLE IF NOT EXISTS abonos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moto_id UUID NOT NULL REFERENCES motos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('mensual', 'quincenal')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  monto NUMERIC(10,2) NOT NULL,
  pagado BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de entradas al parqueadero
CREATE TABLE IF NOT EXISTS entradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moto_id UUID NOT NULL REFERENCES motos(id) ON DELETE CASCADE,
  hora_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  hora_salida TIMESTAMPTZ,
  cobro_extra NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_motos_placa ON motos(placa);
CREATE INDEX IF NOT EXISTS idx_abonos_moto_id ON abonos(moto_id);
CREATE INDEX IF NOT EXISTS idx_entradas_moto_id ON entradas(moto_id);
CREATE INDEX IF NOT EXISTS idx_entradas_hora_salida ON entradas(hora_salida);

-- Deshabilitar Row Level Security para uso interno
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE motos DISABLE ROW LEVEL SECURITY;
ALTER TABLE abonos DISABLE ROW LEVEL SECURITY;
ALTER TABLE entradas DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Usuario inicial por defecto
-- Email: admin@parqueadero.com
-- Contraseña: 1234
-- ============================================================
INSERT INTO usuarios (nombre, email, password_hash)
VALUES ('Admin', 'admin@parqueadero.com', '$2a$10$eiun2Yr.1ZlgBaZKVr30MOaxHxpZMXQww1q7Csjm8ASKdgSIUINl2')
ON CONFLICT (email) DO NOTHING;