const express = require('express');
const router = express.Router();
const { enviarEmail } = require('../services/emailService');

router.post('/test-email', async (req, res) => {
  try {
    const resultado = await enviarEmail(req.body);

    if (resultado) {
      res.status(200).json({ message: 'Correo enviado correctamente.' });
    } else {
      res.status(500).json({ message: 'Error al enviar el correo.' });
    }
  } catch (error) {
    console.error('💥 Error en la ruta /test-email:', error.message);
    res.status(500).json({ message: 'Error interno al procesar el envío.' });
  }
});

module.exports = router;
