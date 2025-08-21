const { getDb, sql } = require('../config/db');

class HistorialInterferencia {
  /**
   * Crea una nueva entrada en la tabla HISTORIAL_SOLICITUD_INTERFERENCIA.
   * @param {number} interferenciaId - El ID de la interferencia asociada.
   * @param {number} estadoId - El ID del estado (ej. 4 para 'Pendiente').
   * @param {number} empresaId - El ID de la empresa asociada.
   * @param {string} [usuario=null] - El usuario que realiza la acción (opcional).
   * @param {sql.Transaction} transaction - La transacción en curso.
   * @returns {Promise<Object>} Promesa que resuelve con el ID de la nueva entrada de historial.
   */
  static async store(interferenciaId, estadoId, empresaId, usuario = null, transaction) {
    try {
      const request = new sql.Request(transaction);
      const tableName = process.env.DB_TABLE_HISTORIAL_SOLICITUD_INTERFERENCIA;

      request.input('HSI_INTERFERENCIA_ID', sql.Int, interferenciaId);
      request.input('HSI_ESTADO_ID', sql.SmallInt, estadoId);
      request.input('HSI_EMPRESA_ID', sql.SmallInt, empresaId);
      request.input('HSI_USUARIO', sql.VarChar(20), usuario);
      request.input('HSI_FECHA', sql.DateTime, new Date());

      const result = await request.query(`
        INSERT INTO ${tableName} (
          HSI_INTERFERENCIA_ID, HSI_ESTADO_ID, HSI_EMPRESA_ID, HSI_USUARIO, HSI_FECHA
        ) VALUES (
          @HSI_INTERFERENCIA_ID, @HSI_ESTADO_ID, @HSI_EMPRESA_ID, @HSI_USUARIO, @HSI_FECHA
        );
        SELECT SCOPE_IDENTITY() AS HSI_ID;
      `);

      // Devuelve el éxito y el ID de la nueva entrada de historial.
      return { success: true, HSI_ID: result.recordset[0].HSI_ID };

    } catch (err) {
      console.error('Error al crear la entrada de estado de interferencia en la base de datos:', err);
      throw err; // Vuelve a lanzar el error.
    }
  }
}

module.exports = HistorialInterferencia;
