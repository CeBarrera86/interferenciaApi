const yup = require('yup');

const ubicacionSchema = yup.object().shape({
  USI_CALLE: yup.string().required(),
  USI_ALTURA: yup.string().required().test('is-valid-altura', 'Debe ser numérico', value => !isNaN(parseFloat(value))),
  USI_PISO: yup.string().notRequired(),
  USI_DPTO: yup.string().notRequired(),
  USI_VEREDA: yup.string().required().oneOf(['P', 'I']),
  USI_ENTRE1: yup.string().notRequired(),
  USI_ENTRE2: yup.string().notRequired(),
  USI_LOCALIDAD_ID: yup.string().required(),
  USI_LATITUD: yup.number().nullable().required(),
  USI_LONGITUD: yup.number().nullable().required(),
});

const interferenciaSchema = yup.object().shape({
  DSI_CUIT: yup.string().required(),
  DSI_NOMBRE: yup.string().required(),
  DSI_APELLIDO: yup.string().required(),
  DSI_PERSONA: yup.string().required().oneOf(['F', 'J']),
  DSI_EMAIL: yup.string().email().required(),
  SOI_PROYECTO: yup.string().trim().notRequired(),
  SOI_DESCRIPCION: yup.string().trim().notRequired(),
  SOI_DESDE: yup.date().nullable().required().min(new Date(), 'Fecha desde debe ser posterior a hoy'),
  SOI_HASTA: yup.date().nullable().required().test(
    'fecha-fin-posterior',
    'La fecha de fin debe ser posterior a la de inicio',
    function (hasta) {
      const desde = this.parent.SOI_DESDE;
      return !desde || !hasta || hasta > desde;
    }
  ),
  SOI_UBICACIONES: yup.array().of(ubicacionSchema).min(1).required(),
  SOI_EMPRESA: yup.array().of(yup.number()).min(1).required(),
  SOI_DOCUMENTO: yup.array().of(yup.mixed()).notRequired().test(
    'at-least-one-adjunto',
    'Debe adjuntar un archivo o una captura de mapa',
    function (documentos) {
      const mapa = this.parent.SOI_MAPA;
      const hayArchivos = Array.isArray(documentos) && documentos.length > 0;
      const hayMapa = !!mapa;
      return hayArchivos || hayMapa;
    }
  ),
  SOI_MAPA: yup.mixed().nullable().notRequired(),
});

module.exports = { interferenciaSchema };