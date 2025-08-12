const { getDb, sql } = require('../config/db');

class HistorialSolicitudInterferencia {
  /**
   * Creates a new entry in the HISTORIAL_SOLICITUD_INTERFERENCIA table.
   * @param {number} interferenciaId - The ID of the associated interference.
   * @param {number} estadoId - The ID of the state (e.g., 4 for 'Pendiente').
   * @param {string} [usuario=null] - The user performing the action (optional).
   * @param {sql.Transaction} transaction - The current transaction.
   * @returns {Promise<Object>} A promise that resolves with the ID of the new history entry.
   */
  static async store(interferenciaId, estadoId, usuario = null, transaction) {
    try {
      const request = new sql.Request(transaction);
      const tableName = process.env.DB_TABLE_HISTORIAL_SOLICITUD_INTERFERENCIA;

      // Assign parameter values for the SQL query
      request.input('HSI_INTERFERENCIA_ID', sql.Int, interferenciaId);
      request.input('HSI_ESTADO_ID', sql.SmallInt, estadoId);
      request.input('HSI_USUARIO', sql.VarChar(20), usuario);
      request.input('HSI_FECHA', sql.DateTime, new Date());

      // Execute the insertion query
      const result = await request.query(`
        INSERT INTO ${tableName} (
          HSI_INTERFERENCIA_ID, HSI_ESTADO_ID, HSI_USUARIO, HSI_FECHA
        ) VALUES (
          @HSI_INTERFERENCIA_ID, @HSI_ESTADO_ID, @HSI_USUARIO, @HSI_FECHA
        );
        SELECT SCOPE_IDENTITY() AS HSI_ID;
      `);

      // Return success and the ID of the new history entry
      return { success: true, HSI_ID: result.recordset[0].HSI_ID };

    } catch (err) {
      console.error('Error al crear la entrada de estado de interferencia en la base de datos:', err);
      throw err; // Re-launch the error
    }
  }
}

module.exports = HistorialSolicitudInterferencia;