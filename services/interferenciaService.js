const SolicitanteInterferencia = require('../models/solicitanteInterferencia');
const Interferencia = require('../models/interferencia');
const UbicacionInterferencia = require('../models/ubicacionInterferencia');
const HistorialInterferencia = require('../models/historialInterferencia');
const { manejarArchivo } = require('../utils/manejoArchivos');
const { transformacionDatos } = require('../utils/transformacionDatos');
const fs = require('fs').promises;

/**
 * Procesa y almacena una nueva solicitud de interferencia, incluyendo todos los datos asociados.
 * @param {object} data - Los datos del cuerpo de la solicitud (req.body).
 * @param {object} files - Los archivos adjuntos (req.files).
 * @param {sql.Transaction} transaction - La transacción de SQL Server en curso.
 * @returns {Promise<number>} El ID de la interferencia creada.
 */
const crearInterferencia = async (data, files, transaction) => {
    // Definición de las empresas a las que notificar, si aplica.
    const tipoEmpresa = {
        1: [2, 3, 6],
        2: [2],
        3: [3],
        6: [6]
    };

    // Aplicar la transformación a los datos principales (SOI_)
    const datosInterferenciaTransformados = transformacionDatos(data, 'SOI_');

    // Crear un objeto con los datos del solicitante y aplicar la transformación con el prefijo 'DSI_'
    const datosSolicitante = {
        DSI_CUIT: data.DSI_CUIT,
        DSI_NOMBRE: data.DSI_NOMBRE,
        DSI_APELLIDO: data.DSI_APELLIDO,
        DSI_PERSONA: data.DSI_PERSONA,
        DSI_EMAIL: data.DSI_EMAIL
    };
    const solicitanteTransformado = transformacionDatos(datosSolicitante, 'DSI_');

    // 1. Verificar si el solicitante ya existe o crearlo
    let solicitanteId = await SolicitanteInterferencia.encontrarSolicitante(solicitanteTransformado.DSI_CUIT, solicitanteTransformado.DSI_EMAIL);
    if (!solicitanteId) {
        const nuevoSolicitante = {
            DSI_CUIT: solicitanteTransformado.DSI_CUIT,
            DSI_NOMBRE: solicitanteTransformado.DSI_NOMBRE,
            DSI_APELLIDO: solicitanteTransformado.DSI_APELLIDO,
            DSI_PERSONA: solicitanteTransformado.DSI_PERSONA,
            DSI_EMAIL: solicitanteTransformado.DSI_EMAIL
        };
        solicitanteId = await SolicitanteInterferencia.store(nuevoSolicitante, transaction);
    }
    if (isNaN(solicitanteId)) {
        throw new Error('El ID del nuevo solicitante no es un número válido.');
    }

    // 2. Crea la solicitud de interferencia
    const nuevaInterferencia = {
        SOI_DSI_ID: solicitanteId,
        SOI_PROYECTO: datosInterferenciaTransformados.SOI_PROYECTO,
        SOI_DESCRIPCION: datosInterferenciaTransformados.SOI_DESCRIPCION,
        SOI_DESDE: datosInterferenciaTransformados.SOI_DESDE,
        SOI_HASTA: datosInterferenciaTransformados.SOI_HASTA,
        SOI_FECHA: new Date(),
        SOI_MAPA: null,
        SOI_DOCUMENTO: null,
    };
    const interferenciaId = await Interferencia.store(nuevaInterferencia, transaction);
    if (isNaN(interferenciaId)) {
        throw new Error('El ID de la nueva interferencia no es un número válido.');
    }

    // 3. Crea los registros de ubicación
    for (const ubicacion of data.SOI_UBICACIONES) {
        const ubicacionTransformada = transformacionDatos(ubicacion, 'USI_');
        const nuevaUbicacion = {
            USI_CALLE: ubicacionTransformada.USI_CALLE,
            USI_ALTURA: ubicacionTransformada.USI_ALTURA,
            USI_PISO: ubicacionTransformada.USI_PISO,
            USI_DPTO: ubicacionTransformada.USI_DPTO,
            USI_ENTRE1: ubicacionTransformada.USI_ENTRE1,
            USI_ENTRE2: ubicacionTransformada.USI_ENTRE2,
            USI_VEREDA: ubicacionTransformada.USI_VEREDA,
            USI_LATITUD: ubicacionTransformada.USI_LATITUD,
            USI_LONGITUD: ubicacionTransformada.USI_LONGITUD,
            USI_LOCALIDAD_ID: ubicacionTransformada.USI_LOCALIDAD_ID,
        };
        await UbicacionInterferencia.store(interferenciaId, nuevaUbicacion, transaction);
    }

    // 4. Crea los registros del historial por cada empresa
    const empresasSeleccionadas = Array.isArray(data.SOI_EMPRESA) ? data.SOI_EMPRESA.map(Number) : [Number(data.SOI_EMPRESA)];
    const empresasHistorial = new Set();
    for (const empresaId of empresasSeleccionadas) {
        if (tipoEmpresa[empresaId]) {
            tipoEmpresa[empresaId].forEach(id => empresasHistorial.add(id));
        }
    }
    for (const empresaId of Array.from(empresasHistorial)) {
        await HistorialInterferencia.store(interferenciaId, 4, empresaId, null, transaction);
    }

    // 5. Mover los archivos subidos al NAS y actualizar la base de datos
    const mapa = files.SOI_MAPA ? files.SOI_MAPA[0] : null;
    const documento = files.SOI_DOCUMENTO ? files.SOI_DOCUMENTO[0] : null;
    const [rutaMapas, rutaDocumentos] = await Promise.all([
        manejarArchivo({ file: mapa, id: interferenciaId, dir: process.env.NAS_MAPAS }),
        manejarArchivo({ file: documento, id: interferenciaId, dir: process.env.NAS_DOCUMENTOS })
    ]);

    if (rutaMapas || rutaDocumentos) {
        await Interferencia.update(interferenciaId, rutaDocumentos, rutaMapas, transaction);
    }
    
    return { id: interferenciaId, rutaDocumentos, rutaMapas };
};

module.exports = {
    crearInterferencia
};