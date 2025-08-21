const { sql } = require('../config/db');

class UbicacionInterferencia {
  /**
   * Almacena una nueva dirección de solicitud de interferencia en la base de datos.
   * @param {number} interferenciaId - ID de la solicitud de interferencia.
   * @param {object} data - Objeto con los datos de la dirección.
   * @param {sql.Transaction} transaction - La transacción de SQL Server en curso.
   * @returns {Promise<object>} Un objeto con la confirmación de éxito.
   */
  static async store(interferenciaId, data, transaction) {
    try {
      const request = new sql.Request(transaction);
      const tableName = process.env.DB_TABLE_UBICACION_SOLICITUD_INTERFERENCIA;

      // Asigna los valores a los parámetros para la consulta SQL.
      request.input('USI_INTERFERENCIA_ID', sql.Int, interferenciaId);
      request.input('USI_CALLE', sql.VarChar(50), data.USI_CALLE);
      request.input('USI_ALTURA', sql.VarChar(10), data.USI_ALTURA);
      request.input('USI_PISO', sql.VarChar(10), data.USI_PISO);
      request.input('USI_DPTO', sql.VarChar(10), data.USI_DPTO);
      request.input('USI_ENTRE1', sql.VarChar(50), data.USI_ENTRE1);
      request.input('USI_ENTRE2', sql.VarChar(50), data.USI_ENTRE2);
      request.input('USI_VEREDA', sql.Char(1), data.USI_VEREDA);
      request.input('USI_LATITUD', sql.Decimal(16, 12), data.USI_LATITUD);
      request.input('USI_LONGITUD', sql.Decimal(16, 12), data.USI_LONGITUD);
      request.input('USI_LOCALIDAD_ID', sql.SmallInt, data.USI_LOCALIDAD_ID);

      // Ejecuta la consulta de inserción.
      await request.query(`
        INSERT INTO ${tableName} (
          USI_INTERFERENCIA_ID, USI_CALLE, USI_ALTURA, USI_PISO, USI_DPTO,
          USI_ENTRE1, USI_ENTRE2, USI_VEREDA, USI_LATITUD, USI_LONGITUD, USI_LOCALIDAD_ID
        ) VALUES (
          @USI_INTERFERENCIA_ID, @USI_CALLE, @USI_ALTURA, @USI_PISO, @USI_DPTO,
          @USI_ENTRE1, @USI_ENTRE2, @USI_VEREDA, @USI_LATITUD, @USI_LONGITUD, @USI_LOCALIDAD_ID
        );
      `);

      return { success: true };
    } catch (err) {
      console.error('Error al guardar la ubicación de la interferencia en la base de datos:', err);
      throw err;
    }
  }
}

module.exports = UbicacionInterferencia;
