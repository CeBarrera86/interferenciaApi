const { getDb, sql } = require('../config/db');

class Interferencia {
  constructor(data) {
    this.SOI_CUIT = data.SOI_CUIT;
    this.SOI_NOMBRE = data.SOI_NOMBRE;
    this.SOI_APELLIDO = data.SOI_APELLIDO;
    this.SOI_PERSONA = data.SOI_PERSONA;
    this.SOI_EMAIL = data.SOI_EMAIL;
    this.SOI_CALLE = data.SOI_CALLE;
    this.SOI_ALTURA = data.SOI_ALTURA;
    this.SOI_PISO = data.SOI_PISO;
    this.SOI_DPTO = data.SOI_DPTO;
    this.SOI_VEREDA = data.SOI_VEREDA;
    this.SOI_ENTRE1 = data.SOI_ENTRE1;
    this.SOI_ENTRE2 = data.SOI_ENTRE2;
    this.SOI_LOCALIDAD_ID = data.SOI_LOCALIDAD_ID;
    this.SOI_LATITUD = data.SOI_LATITUD;
    this.SOI_LONGITUD = data.SOI_LONGITUD;
    this.SOI_DESDE = data.SOI_DESDE;
    this.SOI_HASTA = data.SOI_HASTA;
    this.SOI_FECHA = data.SOI_FECHA;
    this.SOI_PATH = data.SOI_PATH;
  }

  static async store(data) {
    try {
      const pool = await getDb();
      const request = pool.request();
      const tableName = process.env.DB_TABLE_SOLICITUD_INTERFERENCIA;

      request.input('SOI_CUIT', sql.VarChar(20), data.SOI_CUIT);
      request.input('SOI_PERSONA', sql.Char(1), data.SOI_PERSONA);
      request.input('SOI_NOMBRE', sql.VarChar(50), data.SOI_NOMBRE);
      request.input('SOI_APELLIDO', sql.VarChar(50), data.SOI_APELLIDO);
      request.input('SOI_EMAIL', sql.VarChar(50), data.SOI_EMAIL);
      request.input('SOI_CALLE', sql.VarChar(50), data.SOI_CALLE);
      request.input('SOI_ALTURA', sql.VarChar(10), data.SOI_ALTURA);
      request.input('SOI_PISO', sql.VarChar(10), data.SOI_PISO);
      request.input('SOI_DPTO', sql.VarChar(10), data.SOI_DPTO);
      request.input('SOI_ENTRE1', sql.VarChar(50), data.SOI_ENTRE1);
      request.input('SOI_ENTRE2', sql.VarChar(50), data.SOI_ENTRE2);
      request.input('SOI_VEREDA', sql.Char(1), data.SOI_VEREDA);
      request.input('SOI_LATITUD', sql.Decimal(16, 12), data.SOI_LATITUD);
      request.input('SOI_LONGITUD', sql.Decimal(16, 12), data.SOI_LONGITUD);
      request.input('SOI_LOCALIDAD_ID', sql.SmallInt, data.SOI_LOCALIDAD_ID);
      request.input('SOI_DESDE', sql.Date, data.SOI_DESDE);
      request.input('SOI_HASTA', sql.Date, data.SOI_HASTA);
      request.input('SOI_FECHA', sql.DateTime, data.SOI_FECHA);
      request.input('SOI_PATH', sql.VarChar(255), data.SOI_PATH);

      const result = await request.query(`
        INSERT INTO ${tableName} (
            SOI_CUIT, SOI_NOMBRE, SOI_APELLIDO, SOI_PERSONA, SOI_EMAIL,
            SOI_CALLE, SOI_ALTURA, SOI_PISO, SOI_DPTO, SOI_VEREDA,
            SOI_ENTRE1, SOI_ENTRE2, SOI_LOCALIDAD_ID, SOI_LATITUD, SOI_LONGITUD,
            SOI_DESDE, SOI_HASTA, SOI_FECHA, SOI_PATH
        ) VALUES (
            @SOI_CUIT, @SOI_NOMBRE, @SOI_APELLIDO, @SOI_PERSONA, @SOI_EMAIL,
            @SOI_CALLE, @SOI_ALTURA, @SOI_PISO, @SOI_DPTO, @SOI_VEREDA,
            @SOI_ENTRE1, @SOI_ENTRE2, @SOI_LOCALIDAD_ID, @SOI_LATITUD, @SOI_LONGITUD,
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
   */
  static async update(id, newPath) {
    try {
      const pool = await getDb();
      const request = pool.request();
      const tableName = process.env.DB_TABLE_SOLICITUD_INTERFERENCIA;

      request.input('SOI_ID', sql.Int, id);
      // Asegúrate de que newPath sea un string. Si es null, SQL Server lo manejará si la columna es NULLABLE.
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
