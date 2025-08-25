const fs = require('fs').promises;
const path = require('path');

/**
 * Mueve un archivo temporal al NAS y retorna su nueva ruta.
 * @param {object} file - El objeto de archivo de multer.
 * @param {number} id - El ID de la solicitud de interferencia.
 * @param {string} dir - La ruta del directorio de destino en el NAS.
 * @returns {Promise<string | null>} La nueva ruta del archivo o null si no se proporcionó archivo.
 */
const manejarArchivo = async ({ file, id, dir }) => {
    if (!file) {
        return null;
    }

    const extension = path.extname(file.originalname);
    const nuevoNombre = `${id}${extension}`;
    const rutaNAS = path.join(dir, nuevoNombre);
    
    // Asegurarse de que el directorio exista, creando subdirectorios si es necesario
    await fs.mkdir(dir, { recursive: true });
    
    // Mover el archivo del directorio temporal al destino final
    await fs.copyFile(file.path, rutaNAS);

    return rutaNAS;
};

module.exports = {
    manejarArchivo
};
