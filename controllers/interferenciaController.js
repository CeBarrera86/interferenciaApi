const { validationResult } = require('express-validator');
const { getDb, sql } = require('../config/db');
const { crearInterferencia } = require('../services/interferenciaService');
const fs = require('fs').promises;

const interferenciaController = {
  /**
   * Procesa la solicitud de una nueva interferencia, delegando la lógica de negocio a un servicio.
   * @param {object} req - Objeto de la petición (request).
   * @param {object} res - Objeto de la respuesta (response).
   */
  store: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Errores de validación:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    let transaction = null;
    let pathsOriginales = [];

    try {
      const pool = getDb();
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      // Llamamos al servicio para manejar toda la lógica de negocio
      const { id, rutaDocumentos, rutaMapas } = await crearInterferencia(req.body, req.files, transaction);

      // Si todo sale bien, obtenemos las rutas temporales para eliminarlas
      const mapa = req.files.SOI_MAPA ? req.files.SOI_MAPA[0] : null;
      const documento = req.files.SOI_DOCUMENTO ? req.files.SOI_DOCUMENTO[0] : null;
      if (mapa) pathsOriginales.push(mapa.path);
      if (documento) pathsOriginales.push(documento.path);

      // Elimina los archivos temporales de la carpeta 'uploads'
      if (pathsOriginales.length > 0) {
        await Promise.all(pathsOriginales.map(p => fs.unlink(p)));
      }
      
      await transaction.commit();

      res.status(201).json({
        message: 'Interferencia generada con éxito!',
        id: id,
        documento: rutaDocumentos,
        mapa: rutaMapas
      });

    } catch (error) {
      console.error('Error al procesar la solicitud de interferencia:', error);
      if (transaction) {
        try {
          await transaction.rollback();
          console.log('Transacción revertida debido a un error.');
        } catch (rollbackError) {
          console.error('Error al revertir la transacción:', rollbackError);
        }
      }

      // Limpia los archivos temporales en caso de error
      if (pathsOriginales.length > 0) {
        try {
          await Promise.all(pathsOriginales.map(p => fs.unlink(p)));
        } catch (unlinkError) {
          if (unlinkError.code !== 'ENOENT') {
            console.error('Error al intentar limpiar archivos temporales:', unlinkError);
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