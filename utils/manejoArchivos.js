const fs = require('fs').promises;
const path = require('path');

/**
 * Mueve uno o varios archivos al NAS y retorna sus rutas temporales para limpieza.
 * @param {object | object[]} file - Archivo único o array de archivos.
 * @param {number} id - ID de la interferencia.
 * @param {string} dir - Directorio base en el NAS.
 * @returns {Promise<{ destino: string, temporales: string[] }>} Ruta final y rutas temporales.
 */
const manejarArchivo = async ({ file, id, dir }) => {
  if (!file) return { destino: null, temporales: [] };

  const temporales = [];

  if (Array.isArray(file)) {
    const carpetaDestino = path.join(dir, String(id));
    await fs.mkdir(carpetaDestino, { recursive: true });

    await Promise.all(file.map(async (f) => {
      const destino = path.join(carpetaDestino, f.originalname);
      await fs.copyFile(f.path, destino);
      temporales.push(f.path);
    }));

    return { destino: carpetaDestino, temporales };
  }

  const extension = path.extname(file.originalname);
  const nuevoNombre = `${id}${extension}`;
  const rutaNAS = path.join(dir, nuevoNombre);
  await fs.mkdir(dir, { recursive: true });
  await fs.copyFile(file.path, rutaNAS);
  temporales.push(file.path);

  return { destino: rutaNAS, temporales };
};

module.exports = {
  manejarArchivo
};