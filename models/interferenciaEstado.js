const { getDb, sql } = require('../config/db');

class InterferenciaEstado {
  /**
   * Crea una nueva entrada en la tabla INTERFERENCIA_ESTADO_SECTOR.
   * @param {number} interferenciaId - El ID de la interferencia asociada.
   * @param {number} estadoId - El ID del estado (ej. 3 para 'Pendiente').
   * @param {string} [usuario=null] - El usuario que realiza la acción (opcional).
   */
  static async store(interferenciaId, estadoId, usuario = null) {
    try {
      const pool = await getDb();
      const request = pool.request();
      const tableName = process.env.DB_TABLE_INTERFERENCIA_ESTADO_SECTOR;

      // Asignar los valores de los parámetros para la consulta SQL
      request.input('IES_INTERFERENCIA_ID', sql.Int, interferenciaId);
      request.input('IES_ESTADO_ID', sql.SmallInt, estadoId);
      request.input('IES_USUARIO', sql.VarChar(20), usuario);
      request.input('IES_FECHA', sql.DateTime, new Date());

      // Ejecutar la consulta de inserción
      const result = await request.query(`
                INSERT INTO ${tableName} (
                    IES_INTERFERENCIA_ID, IES_ESTADO_ID, IES_USUARIO, IES_FECHA
                ) VALUES (
                    @IES_INTERFERENCIA_ID, @IES_ESTADO_ID, @IES_USUARIO, @IES_FECHA
                );
                SELECT SCOPE_IDENTITY() AS IES_ID;
            `);

      // Devolver el éxito y el ID de la nueva entrada de estado
      return { success: true, IES_ID: result.recordset[0].IES_ID };

    } catch (err) {
      console.error('Error al crear la entrada de estado de interferencia en la base de datos:', err);
      throw err; // Re-lanzar el error
    }
  }
}

module.exports = InterferenciaEstado;
