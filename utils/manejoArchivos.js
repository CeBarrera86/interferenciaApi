const fs = require('fs').promises;
const path = require('path');

/**
 * Mueve uno o varios archivos al NAS y retorna sus rutas.
 * @param {object | object[]} file - Archivo único o array de archivos.
 * @param {number} id - ID de la interferencia.
 * @param {string} dir - Directorio base en el NAS.
 * @returns {Promise<string | null>} Ruta del archivo (mapa) o carpeta (documentos).
 */
const manejarArchivo = async ({ file, id, dir }) => {
  if (!file) return null;

  // Si es un array (SOI_DOCUMENTO)
  if (Array.isArray(file)) {
    const carpetaDestino = path.join(dir, String(id));
    await fs.mkdir(carpetaDestino, { recursive: true });

    await Promise.all(file.map(async (f) => {
      const destino = path.join(carpetaDestino, f.originalname);
      await fs.copyFile(f.path, destino);
    }));

    return carpetaDestino; // solo la ruta de la carpeta
  }

  // Si es un archivo único (SOI_MAPA)
  const extension = path.extname(file.originalname);
  const nuevoNombre = `${id}${extension}`;
  const rutaNAS = path.join(dir, nuevoNombre);
  await fs.mkdir(dir, { recursive: true });
  await fs.copyFile(file.path, rutaNAS);
  return rutaNAS;
};

module.exports = {
  manejarArchivo
};