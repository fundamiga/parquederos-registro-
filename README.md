# PlacaMoto - Sistema de Reconocimiento de Placas para Parqueadero

Sistema de parqueadero que usa la camara del dispositivo para detectar placas de motos mediante OCR.

## Arquitectura

- Backend: Node.js + Express + Supabase
- Frontend: React 18 + Vite + TailwindCSS + Tesseract.js

## Instalacion

### 1. Configurar Supabase

1. Crea un proyecto en https://supabase.com
2. Ve a SQL Editor y ejecuta el contenido de supabase_migration.sql
3. Copia tu Project URL y anon key desde Settings > API

### 2. Configurar variables de entorno

Edita backend/.env:

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
JWT_SECRET=tu-secreto-muy-seguro
PORT=4000

### 3. Instalar dependencias

npm run install:all

### 4. Crear primer usuario operador

POST http://localhost:4000/api/auth/registro
Body: { nombre, email, password }

### 5. Iniciar el sistema

Terminal 1 (Backend):  npm run dev:backend
Terminal 2 (Frontend): npm run dev:frontend

Abrir en el navegador: http://localhost:5173

## Funcionalidades

- Escaner: Activa la camara, captura la placa y lee el texto automaticamente con OCR
- Verificacion: Muestra si la moto tiene abono vigente (mensual/quincenal)
- Parqueadero: Lista de motos actualmente dentro con tiempo de permanencia
- Motos: Gestion de motos registradas (CRUD)
- Abonos: Registro de pagos mensuales/quincenales
- Historial: Registro de todas las entradas y salidas
- Dashboard: Estadisticas del dia y alertas de abonos por vencer
