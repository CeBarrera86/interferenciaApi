const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');
const interferencias = require('./routes/interferencias');
const localidades = require('./routes/localidades');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const ENV = process.env.NODE_ENV || 'development';

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
  res.send(`Bienvenido a la API de Interferencia! Entorno: ${ENV}`);
});

const iniciarServidor = () => {
  if (ENV === 'production') {
    const https = require('https');
    const fs = require('fs');
    const httpsOpciones = {
      cert: fs.readFileSync(process.env.CERT_CRT),
      key: fs.readFileSync(process.env.CERT_KEY)
    };
    https.createServer(httpsOpciones, app).listen(PORT, () => {
      console.log(`Servidor HTTPS corriendo en puerto ${PORT} [PRODUCCIÓN]`);
      conectarDB();
    });
  } else {
    app.listen(PORT, () => {
      console.log(`Servidor HTTP corriendo en puerto ${PORT} [DESARROLLO]`);
      conectarDB();
    });
  }
};

const conectarDB = () => {
  db.connectDb()
    .then(() => console.log('Conectado a la base de datos'))
    .catch(err => {
      console.error('Error al conectar a la base de datos:', err.message);
      process.exit(1);
    });
};

iniciarServidor();