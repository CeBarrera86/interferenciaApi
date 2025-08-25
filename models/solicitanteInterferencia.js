const { sql, getDb } = require('../config/db');

class SolicitanteInterferencia {
  /**
   * Busca un solicitante por CUIT y Email.
   * @param {string} cuit - El CUIT del solicitante.
   * @param {string} email - El email del solicitante.
   * @returns {Promise<number | null>} El ID del solicitante si existe, de lo contrario null.
   */
  static async encontrarSolicitante(cuit, email) {
    try {
      const pool = await getDb();
      const request = pool.request();
      const tableName = process.env.DB_TABLE_DETALLE_SOLICITANTE_INTERFERENCIA;

      const result = await request.query(`
        SELECT DSI_ID FROM ${tableName} WHERE DSI_CUIT = '${cuit}' AND DSI_EMAIL = '${email}'
      `);

      if (result.recordset.length > 0) {
        return result.recordset[0].DSI_ID;
      }
      return null;
    } catch (err) {
      console.error('Error al buscar solicitante por CUIT y email:', err);
      throw err;
    }
  }

  /**
   * Almacena los datos de un nuevo solicitante de interferencia en la base de datos.
   * @param {object} data - Objeto con los datos del solicitante (DSI_CUIT, DSI_NOMBRE, etc.).
   * @param {sql.Transaction} transaction - La transacción de SQL Server en curso.
   * @returns {Promise<number>} El ID del solicitante insertado.
   * @throws {Error} Si la inserción falla.
   */
  static async store(data, transaction) {
    try {
      const request = new sql.Request(transaction);
      const tableName = process.env.DB_TABLE_DETALLE_SOLICITANTE_INTERFERENCIA;

      request.input('DSI_CUIT', sql.VarChar(20), data.DSI_CUIT);
      request.input('DSI_NOMBRE', sql.VarChar(50), data.DSI_NOMBRE);
      request.input('DSI_APELLIDO', sql.VarChar(50), data.DSI_APELLIDO);
      request.input('DSI_PERSONA', sql.Char(1), data.DSI_PERSONA);
      request.input('DSI_EMAIL', sql.VarChar(50), data.DSI_EMAIL);

      // Ejecuta la consulta de inserción y retorna el ID generado.
      const result = await request.query(`
        INSERT INTO ${tableName} (DSI_CUIT, DSI_NOMBRE, DSI_APELLIDO, DSI_PERSONA, DSI_EMAIL)
        OUTPUT INSERTED.DSI_ID
        VALUES (@DSI_CUIT, @DSI_NOMBRE, @DSI_APELLIDO, @DSI_PERSONA, @DSI_EMAIL);
      `);

      if (result.recordset.length > 0) {
        return result.recordset[0].DSI_ID;
      }
      throw new Error('No se pudo obtener el ID del solicitante después de la inserción.');
    } catch (err) {
      console.error('Error al guardar el solicitante en la base de datos:', err);
      throw err;
    }
  }
}

module.exports = SolicitanteInterferencia;