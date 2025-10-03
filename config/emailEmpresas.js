module.exports = {
  2: { // APySU
    nombre: 'Agua y Saneamiento Urbano - CORPICO LTDA.',
    user: process.env.EMAIL_APYSU_USER,
    pass: process.env.EMAIL_APYSU_PASS
  },
  3: { // Eléctrico
    nombre: 'Servicio Eléctrico - CORPICO LTDA.',
    user: process.env.EMAIL_ELECTRICO_USER,
    pass: process.env.EMAIL_ELECTRICO_PASS
  },
  default: { // Más Comunicaciones
    nombre: 'Más Comunicaciones - CORPICO LTDA.',
    user: process.env.EMAIL_MASCOMUNICACIONES_USER,
    pass: process.env.EMAIL_MASCOMUNICACIONES_PASS
  }
};