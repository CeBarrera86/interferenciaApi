const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');
const interferencias = require('./routes/interferencias');
const localidades = require('./routes/localidades');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', './views');

// --- Middleware CORS ---
app.use(cors());

// Middleware para parsear JSON y urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/interferencia', interferencias);
app.use('/api/localidades', localidades);

// Ruta de inicio simple
app.get('/', (req, res) => {
  res.send('Bienvenido a la API de Interferencia!');
});

// Inicia el servidor y conecta a la base de datos
app.listen(PORT, () => {
  db.connectDb().then(() => {
  }).catch(err => {
    console.error('Error al conectar a la base de datos:', err.message);
    // Aquí podrías querer salir del proceso si la conexión a la DB es crítica
    process.exit(1);
  });
});