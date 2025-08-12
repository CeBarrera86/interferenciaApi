const { getDb, sql } = require('../config/db');

class Interferencia {
  constructor(data) {
    this.SOI_CUIT = data.SOI_CUIT;
    this.SOI_NOMBRE = data.SOI_NOMBRE;
    this.SOI_APELLIDO = data.SOI_APELLIDO;
    this.SOI_PERSONA = data.SOI_PERSONA;
    this.SOI_EMAIL = data.SOI_EMAIL;
    this.SOI_DESDE = data.SOI_DESDE;
    this.SOI_HASTA = data.SOI_HASTA;
    this.SOI_FECHA = data.SOI_FECHA;
    this.SOI_PATH = data.SOI_PATH;
  }

  /**
   * Guarda una nueva solicitud de interferencia en la tabla SOLICITUD_INTERFERENCIA.
   * @param {Object} data - Objeto con los datos de la solicitud.
   * @param {sql.Transaction} transaction - La transacción en curso.
   * @returns {Promise<Object>} Promesa que resuelve con el ID de la nueva solicitud.
   */
  static async store(data, transaction) {
    try {
      const request = new sql.Request(transaction);
      const tableName = process.env.DB_TABLE_SOLICITUD_INTERFERENCIA;

      request.input('SOI_CUIT', sql.VarChar(20), data.SOI_CUIT);
      request.input('SOI_PERSONA', sql.Char(1), data.SOI_PERSONA);
      request.input('SOI_NOMBRE', sql.VarChar(50), data.SOI_NOMBRE);
      request.input('SOI_APELLIDO', sql.VarChar(50), data.SOI_APELLIDO);
      request.input('SOI_EMAIL', sql.VarChar(50), data.SOI_EMAIL);
      request.input('SOI_DESDE', sql.Date, data.SOI_DESDE);
      request.input('SOI_HASTA', sql.Date, data.SOI_HASTA);
      request.input('SOI_FECHA', sql.DateTime, data.SOI_FECHA);
      request.input('SOI_PATH', sql.VarChar(255), data.SOI_PATH);

      const result = await request.query(`
        INSERT INTO ${tableName} (
            SOI_CUIT, SOI_NOMBRE, SOI_APELLIDO, SOI_PERSONA, SOI_EMAIL,
            SOI_DESDE, SOI_HASTA, SOI_FECHA, SOI_PATH
        ) VALUES (
            @SOI_CUIT, @SOI_NOMBRE, @SOI_APELLIDO, @SOI_PERSONA, @SOI_EMAIL,
            @SOI_DESDE, @SOI_HASTA, @SOI_FECHA, @SOI_PATH
        );
        SELECT SCOPE_IDENTITY() AS SOI_ID;
      `);

      return { success: true, SOI_ID: result.recordset[0].SOI_ID };

    } catch (err) {
      console.error('Error al guardar la interferencia en la base de datos:', err);
      throw err;
    }
  }

  /**
   * Actualiza la ruta del archivo adjunto para una interferencia específica.
   * @param {number} id - El ID de la interferencia a actualizar.
   * @param {string} newPath - La nueva ruta del archivo en el NAS.
   * @param {sql.Transaction} transaction - La transacción en curso.
   * @returns {Promise<Object>} Promesa que resuelve al completar la actualización.
   */
  static async update(id, newPath, transaction) {
    try {
      const request = new sql.Request(transaction);
      const tableName = process.env.DB_TABLE_SOLICITUD_INTERFERENCIA;

      request.input('SOI_ID', sql.Int, id);
      request.input('SOI_PATH', sql.VarChar(255), newPath);

      await request.query(`
        UPDATE ${tableName}
        SET SOI_PATH = @SOI_PATH
        WHERE SOI_ID = @SOI_ID;
      `);

      return { success: true };
    } catch (err) {
      console.error(`Error al actualizar SOI_PATH para la interferencia ID ${id}:`, err);
      throw err;
    }
  }
}

module.exports = Interferencia;
