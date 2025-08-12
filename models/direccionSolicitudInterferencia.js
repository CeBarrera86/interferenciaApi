const { getDb, sql } = require('../config/db');

class DireccionSolicitudInterferencia {
  /**
   * Guarda los datos de dirección de una interferencia.
   * @param {number} interferenciaId - El ID de la interferencia asociada.
   * @param {Object} data - Objeto con los datos de dirección.
   * @param {sql.Transaction} transaction - La transacción en curso.
   * @returns {Promise<Object>} Promesa que resuelve con el ID de la nueva dirección.
   */
  static async store(interferenciaId, data, transaction) {
    try {
      const request = new sql.Request(transaction);
      const tableName = process.env.DB_TABLE_DIRECCION_SOLICITUD_INTERFERENCIA;

      request.input('DSI_INTERFERENCIA_ID', sql.Int, interferenciaId);
      request.input('DSI_CALLE', sql.VarChar(50), data.DSI_CALLE);
      request.input('DSI_ALTURA', sql.VarChar(10), data.DSI_ALTURA);
      request.input('DSI_PISO', sql.VarChar(10), data.DSI_PISO);
      request.input('DSI_DPTO', sql.VarChar(10), data.DSI_DPTO);
      request.input('DSI_ENTRE1', sql.VarChar(50), data.DSI_ENTRE1);
      request.input('DSI_ENTRE2', sql.VarChar(50), data.DSI_ENTRE2);
      request.input('DSI_VEREDA', sql.Char(1), data.DSI_VEREDA);
      request.input('DSI_LATITUD', sql.Decimal(16, 12), data.DSI_LATITUD);
      request.input('DSI_LONGITUD', sql.Decimal(16, 12), data.DSI_LONGITUD);
      request.input('DSI_LOCALIDAD_ID', sql.SmallInt, data.DSI_LOCALIDAD_ID);

      const result = await request.query(`
        INSERT INTO ${tableName} (
            DSI_INTERFERENCIA_ID, DSI_CALLE, DSI_ALTURA, DSI_PISO, DSI_DPTO, DSI_ENTRE1, DSI_ENTRE2, DSI_VEREDA, DSI_LATITUD, DSI_LONGITUD, DSI_LOCALIDAD_ID
        ) VALUES (
            @DSI_INTERFERENCIA_ID, @DSI_CALLE, @DSI_ALTURA, @DSI_PISO, @DSI_DPTO, @DSI_ENTRE1, @DSI_ENTRE2, @DSI_VEREDA, @DSI_LATITUD, @DSI_LONGITUD, @DSI_LOCALIDAD_ID
        );
        SELECT SCOPE_IDENTITY() AS DSI_ID;
      `);

      return { success: true, DSI_ID: result.recordset[0].DSI_ID };

    } catch (err) {
      console.error('Error al guardar la dirección de la interferencia en la base de datos:', err);
      throw err;
    }
  }
}

module.exports = DireccionSolicitudInterferencia;
