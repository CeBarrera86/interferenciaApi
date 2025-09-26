const SolicitanteInterferencia = require('../models/solicitanteInterferencia');
const Interferencia = require('../models/interferencia');
const UbicacionInterferencia = require('../models/ubicacionInterferencia');
const HistorialInterferencia = require('../models/historialInterferencia');
const { manejarArchivo } = require('../utils/manejoArchivos');
const { transformacionDatos } = require('../utils/transformacionDatos');

const crearInterferencia = async (data, files, transaction) => {
  const tipoEmpresa = {
    1: [2, 3, 6],
    2: [2],
    3: [3],
    6: [6]
  };

  const datosInterferenciaTransformados = transformacionDatos(data, 'SOI_');

  const datosSolicitante = {
    DSI_CUIT: data.DSI_CUIT,
    DSI_NOMBRE: data.DSI_NOMBRE,
    DSI_APELLIDO: data.DSI_APELLIDO,
    DSI_PERSONA: data.DSI_PERSONA,
    DSI_EMAIL: data.DSI_EMAIL
  };
  const solicitanteTransformado = transformacionDatos(datosSolicitante, 'DSI_');

  let solicitanteId = await SolicitanteInterferencia.encontrarSolicitante(solicitanteTransformado.DSI_CUIT, solicitanteTransformado.DSI_EMAIL);
  if (!solicitanteId) {
    solicitanteId = await SolicitanteInterferencia.store(solicitanteTransformado, transaction);
  }
  if (isNaN(solicitanteId)) throw new Error('El ID del nuevo solicitante no es válido.');

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
  if (isNaN(interferenciaId)) throw new Error('El ID de la interferencia no es válido.');

  for (const ubicacion of data.SOI_UBICACIONES) {
    const ubicacionTransformada = transformacionDatos(ubicacion, 'USI_');
    await UbicacionInterferencia.store(interferenciaId, ubicacionTransformada, transaction);
  }

  const empresasSeleccionadas = Array.isArray(data.SOI_EMPRESA) ? data.SOI_EMPRESA.map(Number) : [Number(data.SOI_EMPRESA)];
  const empresasHistorial = new Set();
  for (const empresaId of empresasSeleccionadas) {
    if (tipoEmpresa[empresaId]) { ctipoEmpresa[empresaId].forEach(id => empresasHistorial.add(id)); c }
  }
  for (const empresaId of Array.from(empresasHistorial)) {
    await HistorialInterferencia.store(interferenciaId, 4, empresaId, null, transaction);
  }

  const documentos = files.SOI_DOCUMENTO || [];
  const mapa = files.SOI_MAPA ? files.SOI_MAPA[0] : null;

  const [mapaResult, documentosResult] = await Promise.all([
    manejarArchivo({ file: mapa, id: interferenciaId, dir: process.env.NAS_MAPAS }),
    manejarArchivo({ file: documentos, id: interferenciaId, dir: process.env.NAS_DOCUMENTOS })
  ]);

  if (mapaResult.destino || documentosResult.destino) {
    await Interferencia.update(interferenciaId, documentosResult.destino, mapaResult.destino, transaction);
  }

  return {
    id: interferenciaId,
    rutaDocumentos: documentosResult.destino,
    rutaMapas: mapaResult.destino,
    temporales: [...mapaResult.temporales, ...documentosResult.temporales]
  };
};

module.exports = { crearInterferencia };