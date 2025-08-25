const express = require('express');
const router = express.Router();
const { getDb, sql } = require('../config/db');

router.get('/', async (req, res) => {
  let pool;

  try {
    pool = getDb();
    const request = pool.request();
    const result = await request.query`SELECT [LOC_ID], [LOC_DESCRIPCION] FROM [dbo].[LOCALIDAD] WHERE [LOC_SUCURSAL] = 1`;

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching localidades from DB:', err);
    if (err.message.includes('La conexión a la base de datos no ha sido establecida')) {
      res.status(503).json({ message: 'Servicio de base de datos no disponible.', error: err.message });
    } else {
      res.status(500).json({ message: 'Error fetching localidades', error: err.message });
    }
  }
});

module.exports = router;