const Interferencia = require('../models/interferencia');
const HistorialInterferencia = require('../models/historialInterferencia');
const UbicacionInterferencia = require('../models/ubicacionInterferencia');
const SolicitanteInterferencia = require('../models/solicitanteInterferencia');
const fs = require('fs').promises;
const path = require('path');
const { validationResult } = require('express-validator');
const { transformacionDatos } = require('../utils/transformacionDatos');
const { getDb, sql } = require('../config/db');

const interferenciaController = {
  store: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Errores de validación:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    let interferenciaId = null;
    let pathOriginal = null;
    let transaction = null;

    try {
      const pool = getDb();
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      const servicioToEmpresaMap = {
        1: [2, 3, 6],
        2: [2],
        3: [3],
        6: [6]
      };

      // --- CAMBIO: Se ajustan los nombres de las variables para que coincidan con el frontend (DSI_) ---
      const {
        DSI_CUIT,
        DSI_NOMBRE,
        DSI_APELLIDO,
        DSI_PERSONA,
        DSI_EMAIL,
        SOI_PROYECTO,
        SOI_DESCRIPCION,
        SOI_DESDE,
        SOI_HASTA,
        SOI_UBICACIONES,
        SOI_SERVICIO
      } = req.body;

      // 1. Crea el registro en la tabla DETALLE_SOLICITANTE_INTERFERENCIA
      const dataToStoreSolicitante = {
        DSI_CUIT: DSI_CUIT,
        DSI_NOMBRE: DSI_NOMBRE,
        DSI_APELLIDO: DSI_APELLIDO,
        DSI_PERSONA: DSI_PERSONA,
        DSI_EMAIL: DSI_EMAIL,
      };

      const solicitanteId = await SolicitanteInterferencia.store(dataToStoreSolicitante, transaction);
      if (isNaN(solicitanteId)) {
        throw new Error('El ID del solicitante principal no es un número válido.');
      }

      const dataToStoreInterferencia = {
        SOI_DSI_ID: solicitanteId,
        SOI_PROYECTO,
        SOI_DESCRIPCION,
        SOI_DESDE,
        SOI_HASTA,
        SOI_FECHA: new Date(),
        SOI_MAPA: null,
        SOI_DOCUMENTO: null,
      };

      // 2. Crea la solicitud de interferencia principal
      const resultInterferencia = await Interferencia.store(dataToStoreInterferencia, transaction);

      if (resultInterferencia && resultInterferencia.recordset && resultInterferencia.recordset.length > 0) {
        interferenciaId = Number(resultInterferencia.recordset[0].SOI_ID);
        if (isNaN(interferenciaId)) {
          throw new Error('El ID de la interferencia principal no es un número válido.');
        }
      } else {
        throw new Error('No se pudo obtener el ID de la interferencia principal después de la inserción.');
      }

      // 3. Crea los registros de ubicación para cada ubicación en el array
      for (const ubicacion of SOI_UBICACIONES) {
        // La transformación ya debería manejar el prefijo USI_
        const ubicacionTransformada = transformacionDatos(ubicacion, 'USI_');

        const dataToStoreUbicacion = {
          USI_CALLE: ubicacionTransformada.USI_CALLE,
          USI_ALTURA: ubicacionTransformada.USI_ALTURA,
          USI_PISO: ubicacionTransformada.USI_PISO,
          USI_DPTO: ubicacionTransformada.USI_DPTO,
          USI_ENTRE1: ubicacionTransformada.USI_ENTRE1,
          USI_ENTRE2: ubicacionTransformada.USI_ENTRE2,
          USI_VEREDA: ubicacionTransformada.USI_VEREDA,
          USI_LATITUD: ubicacionTransformada.USI_LATITUD,
          USI_LONGITUD: ubicacionTransformada.USI_LONGITUD,
          USI_LOCALIDAD_ID: ubicacionTransformada.USI_LOCALIDAD_ID,
        };

        await UbicacionInterferencia.store(interferenciaId, dataToStoreUbicacion, transaction);
      }

      // 4. Crea una tupla de datos en el historial de estados por cada empresa
      const servicios = Array.isArray(SOI_SERVICIO) ? SOI_SERVICIO : [SOI_SERVICIO];
      const empresasParaHistorial = new Set();

      for (const servicioId of servicios) {
        const empresas = servicioToEmpresaMap[servicioId];
        if (empresas) {
          empresas.forEach(empresaId => empresasParaHistorial.add(empresaId));
        }
      }

      for (const empresaId of Array.from(empresasParaHistorial)) {
        await HistorialInterferencia.store(interferenciaId, 4, empresaId, 'Sistema', transaction);
      }

      const archivoAdjunto = req.file;
      let pathNAS = null;
      if (archivoAdjunto) {
        pathOriginal = archivoAdjunto.path;

        const extension = path.extname(archivoAdjunto.originalname);
        const nuevoNombre = `${interferenciaId}${extension}`;

        const directorioNAS = process.env.NAS_DOCUMENTOS;
        pathNAS = path.join(directorioNAS, nuevoNombre);

        await fs.mkdir(directorioNAS, { recursive: true });
        await fs.copyFile(pathOriginal, pathNAS);
        await fs.unlink(pathOriginal);
        await Interferencia.update(interferenciaId, pathNAS, transaction);
      }

      await transaction.commit();

      res.status(201).json({
        message: 'Interferencia generada con éxito!',
        id: interferenciaId
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
      if (pathOriginal) {
        try {
          await fs.access(pathOriginal);
          await fs.unlink(pathOriginal);
        } catch (unlinkError) {
          if (unlinkError.code !== 'ENOENT') {
            console.error(`Error al eliminar el archivo temporal ${pathOriginal} en el catch:`, unlinkError);
          }
        }
      }
      let userFriendlyMessage = 'Ocurrió un error inesperado al guardar la interferencia.';
      if (error.code === 'ENOENT' && error.path && error.path.includes(process.env.NAS_DOCUMENTOS)) {
        userFriendlyMessage = 'No se pudo guardar el archivo adjunto en el destino. Verifique la conexión de red.';
      } else if (error.message.includes('SQLSTATE')) {
        userFriendlyMessage = 'Problema al interactuar con la base de datos.';
      }

      res.status(500).json({
        message: userFriendlyMessage,
        details: error.message
      });
    }
  }
};

module.exports = interferenciaController;
