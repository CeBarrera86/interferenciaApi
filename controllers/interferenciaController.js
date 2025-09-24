const { getDb, sql } = require('../config/db');
const { crearInterferencia } = require('../services/interferenciaService');
const { interferenciaSchema } = require('../validation/interferenciaSchema');
const fs = require('fs').promises;

const interferenciaController = {
  store: async (req, res) => {
    // ✅ Parsear JSON SOI_UBICACIONES
    let ubicaciones = [];
    try {
      ubicaciones = JSON.parse(req.body.SOI_UBICACIONES);
      req.body.SOI_UBICACIONES = ubicaciones;
    } catch (e) {
      console.error('❌ Error al parsear SOI_UBICACIONES:', e);
      return res.status(400).json({ message: 'Ubicaciones mal formateadas. Verificá el envío desde el frontend.' });
    }

    // ✅ Validar todo el cuerpo con yup
    try {
      // ✅ Inyectar archivos en req.body para que yup los vea
      req.body.SOI_DOCUMENTO = req.files.SOI_DOCUMENTO || [];
      req.body.SOI_MAPA = req.files.SOI_MAPA ? req.files.SOI_MAPA[0] : null;
      await interferenciaSchema.validate(req.body, { abortEarly: false });
    } catch (validationError) {
      console.error('❌ Error de validación:', validationError.errors);
      return res.status(400).json({
        message: 'Error de validación en los datos enviados.',
        errors: validationError.errors,
      });
    }

    let transaction = null;
    let pathsOriginales = [];

    try {
      const pool = getDb();
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      // 🧠 Lógica principal delegada al servicio
      const { id, rutaDocumentos, rutaMapas } = await crearInterferencia(req.body, req.files, transaction);

      // 🧹 Preparar archivos para limpieza
      const mapa = req.files.SOI_MAPA ? req.files.SOI_MAPA[0] : null;
      const documentos = req.files.SOI_DOCUMENTO || [];
      if (mapa) pathsOriginales.push(mapa.path);
      documentos.forEach(doc => pathsOriginales.push(doc.path));

      // 🧹 Eliminar archivos temporales
      if (pathsOriginales.length > 0) {
        await Promise.all(pathsOriginales.map(p => fs.unlink(p)));
      }

      await transaction.commit();

      res.status(201).json({
        message: 'Interferencia generada con éxito!',
        id,
        documento: rutaDocumentos,
        mapa: rutaMapas
      });

    } catch (error) {
      console.error('💥 Error al procesar la solicitud de interferencia:', error);
      if (transaction) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          console.error('⚠️ Error al revertir la transacción:', rollbackError);
        }
      }

      // 🧹 Limpieza en caso de error
      if (pathsOriginales.length > 0) {
        try {
          await Promise.all(pathsOriginales.map(p => fs.unlink(p)));
        } catch (unlinkError) {
          if (unlinkError.code !== 'ENOENT') {
            console.error('🧹 Error al limpiar archivos temporales:', unlinkError);
          }
        }
      }

      let mensajeAmigable = 'Ocurrió un error al guardar la interferencia.';
      if (error.code === 'ENOENT' && error.path) {
        if (error.path.includes(process.env.NAS_DOCUMENTOS) || error.path.includes(process.env.NAS_MAPAS)) {
          mensajeAmigable = 'No se pudo guardar el archivo adjunto en el destino. Verifique la conexión de red.';
        }
      } else if (error.message.includes('SQLSTATE')) {
        mensajeAmigable = 'Problema al interactuar con la base de datos.';
      }

      res.status(500).json({ message: mensajeAmigable, details: error.message });
    }
  }
};

module.exports = interferenciaController;