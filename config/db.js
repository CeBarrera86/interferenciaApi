const sql = require('mssql');

const dotenv = require('dotenv');
dotenv.config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    port: parseInt(process.env.DB_PORT, 10) || 1433
};

let pool;

/**
 * Función para establecer la conexión a la base de datos.
 * @returns {Promise<sql.ConnectionPool>} Una promesa que resuelve con el pool de conexiones.
 */
async function connectDb() {
    try {
        // Si ya existe un pool, lo devuelve. Esto evita crear múltiples pools.
        if (pool && pool.connected) {
            console.log('Ya conectado a la base de datos.');
            return pool;
        }

        // Crea un nuevo pool de conexiones utilizando la configuración definida.
        pool = await sql.connect(config);
        console.log('Conexión a SQL Server establecida.');
        return pool;
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        throw err;
    }
}

/**
 * Función para obtener el pool de conexiones existente.
 * @returns {sql.ConnectionPool} El pool de conexiones.
 * @throws {Error} Si el pool no ha sido inicializado.
 */
function getDb() {
    if (!pool || !pool.connected) {
        throw new Error('La conexión a la base de datos no ha sido establecida. Llama a connectDb() primero.');
    }
    return pool;
}

module.exports = { connectDb, getDb, sql };
