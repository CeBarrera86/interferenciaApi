const Interferencia = require('../models/interferencia');
const HistorialSolicitudInterferencia = require('../models/historialSolicitudInterferencia');
const DireccionSolicitudInterferencia = require('../models/direccionSolicitudInterferencia');
const fs = require('fs').promises;
const path = require('path');
const { validationResult } = require('express-validator');
const { transformacionDatos } = require('../utils/transformacionDatos');
const { getDb } = require('../config/db');

const interferenciaController = {
  /**
   * Almacena los datos de una nueva interferencia en múltiples tablas de la base de datos
   * dentro de una transacción para garantizar la integridad.
   * @param {Object} req - (contiene los datos del req.body y el req.file).
   * @param {Object} res
   */
  store: async (req, res) => {
    // Verifica si hay errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Errores de validación:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    let interferenciaId = null;
    let pathOriginal = null;
    let transaction = null;

    try {
      // Iniciar la transacción
      const pool = getDb();
      transaction = new pool.Transaction();
      await transaction.begin();

      // Transformar los datos principales del solicitante (fuera del array de ubicaciones)
      const interferenciaData = transformacionDatos(req.body);
      const ubicaciones = JSON.parse(interferenciaData.SOI_UBICACIONES);

      // Separar los datos de la solicitud principal
      const dataToStoreInterferencia = {
        SOI_CUIT: interferenciaData.SOI_CUIT,
        SOI_NOMBRE: interferenciaData.SOI_NOMBRE,
        SOI_APELLIDO: interferenciaData.SOI_APELLIDO,
        SOI_PERSONA: interferenciaData.SOI_PERSONA,
        SOI_EMAIL: interferenciaData.SOI_EMAIL,
        SOI_DESDE: interferenciaData.SOI_DESDE,
        SOI_HASTA: interferenciaData.SOI_HASTA,
        SOI_FECHA: new Date(),
        SOI_PATH: null, // Se establece en null para la inserción inicial
      };

      // 1. Crea la solicitud de interferencia principal
      const resultInterferencia = await Interferencia.store(dataToStoreInterferencia, transaction);
      interferenciaId = resultInterferencia.SOI_ID;

      // 2. Crea los registros de dirección para cada ubicación en el array
      for (const ubicacion of ubicaciones) {
        // Aplica las transformaciones a CADA objeto de ubicación individual
        const ubicacionTransformada = transformacionDatos(ubicacion);
        
        const dataToStoreDireccion = {
          DSI_CALLE: ubicacionTransformada.SOI_CALLE,
          DSI_ALTURA: ubicacionTransformada.SOI_ALTURA,
          DSI_PISO: ubicacionTransformada.SOI_PISO,
          DSI_DPTO: ubicacionTransformada.SOI_DPTO,
          DSI_ENTRE1: ubicacionTransformada.SOI_ENTRE1,
          DSI_ENTRE2: ubicacionTransformada.SOI_ENTRE2,
          DSI_VEREDA: ubicacionTransformada.SOI_VEREDA,
          DSI_LATITUD: ubicacionTransformada.SOI_LATITUD,
          DSI_LONGITUD: ubicacionTransformada.SOI_LONGITUD,
          DSI_LOCALIDAD_ID: ubicacionTransformada.SOI_LOCALIDAD_ID,
        };
        await DireccionSolicitudInterferencia.store(interferenciaId, dataToStoreDireccion, transaction);
      }

      // 3. Crea una nueva tupla de datos en el historial de estados
      // El estado 'Pendiente' tiene ID 4 según los datos insertados.
      await HistorialSolicitudInterferencia.store(interferenciaId, 4, 'Sistema', transaction);

      // Procesamiento del archivo adjunto
      const archivoAdjunto = req.file;
      let pathNAS = null;
      if (archivoAdjunto) {
        pathOriginal = archivoAdjunto.path; // Guardar la ruta temporal

        const extension = path.extname(archivoAdjunto.originalname); // Obtengo extensión del archivo
        const nuevoNombre = `${interferenciaId}${extension}`; // Cambio nombre del archivo

        // Destino en el NAS (unidad mapeada)
        const directorioNAS = process.env.NAS_PATH;
        pathNAS = path.join(directorioNAS, nuevoNombre);

        // Asegurar conectividad con NAS
        await fs.mkdir(directorioNAS, { recursive: true });

        // Copia el archivo del directorio temporal al NAS
        await fs.copyFile(pathOriginal, pathNAS);

        // Elimina el archivo temporal original de Multer
        await fs.unlink(pathOriginal);

        // Actualiza SOI_PATH en la base de datos
        await Interferencia.update(interferenciaId, pathNAS, transaction);
      }

      // Si todo fue exitoso, confirmar la transacción
      await transaction.commit();

      // Si todo sale bien, devolver que todo salió correcto al frontend
      res.status(201).json({
        message: 'Interferencia generada con éxito!',
        id: interferenciaId
      });

    } catch (error) {
      console.error('Error al procesar la solicitud de interferencia:', error);

      // Revertir la transacción en caso de error
      if (transaction) {
        try {
          await transaction.rollback();
          console.log('Transacción revertida debido a un error.');
        } catch (rollbackError) {
          console.error('Error al revertir la transacción:', rollbackError);
        }
      }

      // Lógica para eliminar el archivo temporal en caso de fallo
      if (pathOriginal) {
        try {
          await fs.access(pathOriginal);
          await fs.unlink(pathOriginal);
        } catch (unlinkError) {
          if (!unlinkError.code === 'ENOENT') {
            console.error(`Error al eliminar el archivo temporal ${pathOriginal} en el catch:`, unlinkError);
          }
        }
      }
      let userFriendlyMessage = 'Ocurrió un error inesperado al guardar la interferencia.';
      if (error.code === 'ENOENT' && error.path && error.path.includes(process.env.NAS_PATH)) {
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
// const Interferencia = require('../models/interferencia');
// const InterferenciaEstado = require('../models/interferenciaEstado');
// const fs = require('fs').promises;
// const path = require('path');
// const { validationResult } = require('express-validator');
// const { transformacionDatos } = require('../utils/transformacionDatos');

// const interferenciaController = {
//   /**
//    * Almacena los datos de una nueva interferencia.
//    * @param {Object} req - (contiene los datos del req.body y el req.file).
//    * @param {Object} res
//    */
//   store: async (req, res) => {
//     // Verifica si hay errores de validación según Middleware de validación en routes
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       console.error('Errores de validación:', errors.array());
//       return res.status(400).json({ errors: errors.array() });
//     }

//     let interferenciaId = null;
//     let pathOriginal = null;

//     try {
//       let interferenciaData = req.body;

//       // Aplicar transformaciones a los datos recibidos
//       interferenciaData = transformacionDatos(interferenciaData);

//       const archivoAdjunto = req.file;

//       // Preparar los datos para la inserción inicial
//       const dataToStore = {
//         ...interferenciaData,
//         SOI_PATH: null, // Se establece en null para la inserción inicial
//         SOI_DESDE: interferenciaData.SOI_DESDE,
//         SOI_HASTA: interferenciaData.SOI_HASTA,
//         SOI_FECHA: new Date(),
//       };

//       // Crea la interferencia
//       const result = await Interferencia.store(dataToStore);
//       interferenciaId = result.SOI_ID; // Obtengo el ID

//       // Procesamiento de archivo
//       let pathNAS = null;
//       if (archivoAdjunto) {
//         pathOriginal = archivoAdjunto.path; // Guardar la ruta temporal

//         const extension = path.extname(archivoAdjunto.originalname); // Obtengo extensión del archivo
//         const nuevoNombre = `${interferenciaId}${extension}`; // Cambio nombre del archivo

//         // Destino en el NAS (unidad mapeada)
//         const directorioNAS = process.env.NAS_PATH;
//         pathNAS = path.join(directorioNAS, nuevoNombre);

//         // Asegurarse conectividad con NAS
//         await fs.mkdir(directorioNAS, { recursive: true });

//         // Copia el archivo del directorio temporal al NAS
//         await fs.copyFile(pathOriginal, pathNAS);

//         // Elimina el archivo temporal original de Multer
//         await fs.unlink(pathOriginal);

//         // Actualiza SOI_PATH en la base de datos
//         await Interferencia.update(interferenciaId, pathNAS);
//       }

//       // Crear una nueva tupla de datos en INTERFERENCIA_ESTADO_SECTOR
//       await InterferenciaEstado.store(interferenciaId, 3, 'Sistema'); // 'Sistemas' se debe reemplazar por usuario logueado

//       // Si todo sale bien, devolver que todo salió correcto al frontend
//       res.status(201).json({
//         message: 'Interferencia generada con éxito!',
//         id: interferenciaId
//       });

//     } catch (error) {
//       console.error('Error al procesar la solicitud de interferencia:', error);

//       if (pathOriginal) {
//         try {
//           await fs.access(pathOriginal);
//           await fs.unlink(pathOriginal);
//         } catch (unlinkError) {
//           if (!unlinkError.code === 'ENOENT') {
//             console.error(`Error al eliminar el archivo temporal ${pathOriginal} en el catch:`, unlinkError);
//           }
//         }
//       }
//       let userFriendlyMessage = 'Ocurrió un error inesperado al guardar la interferencia.';
//       if (error.code === 'ENOENT' && error.path && error.path.includes(process.env.NAS_PATH)) {
//         userFriendlyMessage = 'No se pudo guardar el archivo adjunto en el destino. Verifique la conexión de red.';
//       } else if (error.message.includes('SQLSTATE')) {
//         userFriendlyMessage = 'Problema al interactuar con la base de datos.';
//       }

//       res.status(500).json({
//         message: userFriendlyMessage,
//         details: error.message
//       });
//     }
//   }
// };

// module.exports = interferenciaController;