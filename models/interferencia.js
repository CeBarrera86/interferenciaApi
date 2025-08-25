const { getDb, sql } = require('../config/db');

class Interferencia {
  /**
   * Guarda una nueva solicitud de interferencia en la tabla SOLICITUD_INTERFERENCIA.
   * @param {Object} data - Objeto con los datos de la solicitud (SOI_DSI_ID, SOI_PROYECTO, etc.).
   * @param {sql.Transaction} transaction - La transacción en curso.
   * @returns {Promise<Object>} Promesa que resuelve con el objeto de resultado completo de la consulta.
   */
  static async store(data, transaction) {
    try {
      const request = new sql.Request(transaction);
      const tableName = process.env.DB_TABLE_SOLICITUD_INTERFERENCIA;

      request.input('SOI_DSI_ID', sql.Int, data.SOI_DSI_ID);
      request.input('SOI_PROYECTO', sql.VarChar(50), data.SOI_PROYECTO);
      request.input('SOI_DESCRIPCION', sql.VarChar(1024), data.SOI_DESCRIPCION);
      request.input('SOI_DESDE', sql.Date, data.SOI_DESDE);
      request.input('SOI_HASTA', sql.Date, data.SOI_HASTA);
      request.input('SOI_FECHA', sql.DateTime, data.SOI_FECHA);
      request.input('SOI_MAPA', sql.VarChar(255), data.SOI_MAPA);
      request.input('SOI_DOCUMENTO', sql.VarChar(255), data.SOI_DOCUMENTO);

      const result = await request.query(`
        INSERT INTO ${tableName} (
            SOI_DSI_ID, SOI_PROYECTO, SOI_DESCRIPCION, SOI_DESDE, SOI_HASTA, SOI_FECHA, SOI_MAPA, SOI_DOCUMENTO
        ) OUTPUT INSERTED.SOI_ID
        VALUES (
            @SOI_DSI_ID, @SOI_PROYECTO, @SOI_DESCRIPCION, @SOI_DESDE, @SOI_HASTA, @SOI_FECHA, @SOI_MAPA, @SOI_DOCUMENTO
        );
      `);

      if (result.recordset && result.recordset.length > 0) {
        return result.recordset[0].SOI_ID;
      }
      throw new Error('No se pudo obtener el ID de la interferencia después de la inserción.');

    } catch (err) {
      console.error('Error al guardar la interferencia en la base de datos:', err);
      throw err;
    }
  }

  /**
   * Actualiza la ruta del archivo adjunto para una interferencia específica.
   * @param {number} id - El ID de la interferencia a actualizar.
   * @param {string | null} pathDocumentos - La nueva ruta del archivo en el NAS.
   * @param {string | null} pathMapas - La nueva ruta del archivo de mapa en el NAS.
   * @param {sql.Transaction} transaction - La transacción en curso.
   * @returns {Promise<Object>} Promesa que resuelve al completar la actualización.
   */
  static async update(id, pathDocumentos, pathMapas, transaction) {
    try {
      const request = new sql.Request(transaction);
      const tableName = process.env.DB_TABLE_SOLICITUD_INTERFERENCIA;
      let queryUpdate = [];

      // Construir la consulta de forma dinámica
      if (pathDocumentos !== undefined && pathDocumentos !== null) {
        request.input('SOI_DOCUMENTO', sql.VarChar(255), pathDocumentos);
        queryUpdate.push('SOI_DOCUMENTO = @SOI_DOCUMENTO');
      }

      if (pathMapas !== undefined && pathMapas !== null) {
        request.input('SOI_MAPA', sql.VarChar(255), pathMapas);
        queryUpdate.push('SOI_MAPA = @SOI_MAPA');
      }

      // Si no hay campos para actualizar, no hacemos nada
      if (queryUpdate.length === 0) {
        return { success: false, message: 'No hay datos para actualizar.' };
      }

      request.input('SOI_ID', sql.Int, id);

      // Unir los campos para la consulta SQL
      const updateString = queryUpdate.join(', ');

      await request.query(` UPDATE ${tableName} SET ${updateString} WHERE SOI_ID = @SOI_ID; `);

      return { success: true };
    } catch (err) {
      console.error(`Error al actualizar las rutas de la interferencia ${id}:`, err);
      throw err;
    }
  }
}

module.exports = Interferencia;