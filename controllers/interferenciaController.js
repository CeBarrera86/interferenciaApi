const Interferencia = require('../models/interferencia');
const InterferenciaEstado = require('../models/interferenciaEstado');
const fs = require('fs').promises;
const path = require('path');
const { validationResult } = require('express-validator');
const { transformacionDatos } = require('../utils/transformacionDatos');

const interferenciaController = {
  /**
   * Almacena los datos de una nueva interferencia.
   * @param {Object} req - (contiene los datos del req.body y el req.file).
   * @param {Object} res
   */
  store: async (req, res) => {
    // Verifica si hay errores de validación según Middleware de validación en routes
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Errores de validación:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    let interferenciaId = null;
    let pathOriginal = null;

    try {
      let interferenciaData = req.body;

      // Aplicar transformaciones a los datos recibidos
      interferenciaData = transformacionDatos(interferenciaData);

      const archivoAdjunto = req.file;

      // Preparar los datos para la inserción inicial
      const dataToStore = {
        ...interferenciaData,
        SOI_PATH: null, // Se establece en null para la inserción inicial
        SOI_DESDE: interferenciaData.SOI_DESDE,
        SOI_HASTA: interferenciaData.SOI_HASTA,
        SOI_FECHA: new Date(),
      };

      // Crea la interferencia
      const result = await Interferencia.store(dataToStore);
      interferenciaId = result.SOI_ID; // Obtengo el ID

      // Procesamiento de archivo
      let pathNAS = null;
      if (archivoAdjunto) {
        pathOriginal = archivoAdjunto.path; // Guardar la ruta temporal

        const extension = path.extname(archivoAdjunto.originalname); // Obtengo extensión del archivo
        const nuevoNombre = `${interferenciaId}${extension}`; // Cambio nombre del archivo

        // Destino en el NAS (unidad mapeada)
        const directorioNAS = process.env.NAS_PATH;
        pathNAS = path.join(directorioNAS, nuevoNombre);

        // Asegurarse conectividad con NAS
        await fs.mkdir(directorioNAS, { recursive: true });

        // Copia el archivo del directorio temporal al NAS
        await fs.copyFile(pathOriginal, pathNAS);

        // Elimina el archivo temporal original de Multer
        await fs.unlink(pathOriginal);

        // Actualiza SOI_PATH en la base de datos
        await Interferencia.update(interferenciaId, pathNAS);
      }

      // Crear una nueva tupla de datos en INTERFERENCIA_ESTADO_SECTOR
      await InterferenciaEstado.store(interferenciaId, 3, 'Sistema'); // 'Sistemas' se debe reemplazar por usuario logueado

      // Si todo sale bien, devolver que todo salió correcto al frontend
      res.status(201).json({
        message: 'Interferencia guardada con éxito',
        id: interferenciaId,
        filePath: pathNAS // Devolver la ruta final si se adjuntó un archivo
      });

    } catch (error) {
      console.error('Error al procesar el almacenamiento de la interferencia:', error);

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
      res.status(500).json({ message: 'Error interno del servidor al guardar la interferencia.', error: error.message });
    }
  }
};

module.exports = interferenciaController;