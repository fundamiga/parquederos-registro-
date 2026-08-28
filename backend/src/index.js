require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/motos', require('./routes/motos'));
app.use('/api/abonos', require('./routes/abonos'));
app.use('/api/placas', require('./routes/placas'));
app.use('/api/parqueadero', require('./routes/parqueadero'));

app.get('/api/health', (_, res) =>
  res.json({ status: 'OK', sistema: 'PlacaMoto', time: new Date().toISOString() })
);

app.listen(PORT, () => {
  console.log(`🏍️  PlacaMoto API corriendo en http://localhost:${PORT}`);
  console.log(`💡 Health check: http://localhost:${PORT}/api/health`);
});
