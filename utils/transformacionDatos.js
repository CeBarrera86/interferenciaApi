/**
 * Elimina espacios en blanco al inicio y al final de todas las propiedades de tipo string de un objeto.
 * @param {Object} data
 * @returns {Object}
 */
const trimStringsInObject = (data) => {
  const newData = { ...data }; // Crea una copia para no modificar el objeto original directamente
  for (const key in newData) {
    if (typeof newData[key] === 'string') {
      newData[key] = newData[key].trim();
    }
  }
  return newData;
};

/**
 * Convierte a mayúsculas los campos de texto especificados.
 * @param {Object} data
 * @param {Array<string>} fieldsToUppercase
 * @returns {Object}
 */
const camposMayuscula = (data, fieldsToUppercase) => {
  const newData = { ...data };
  fieldsToUppercase.forEach(field => {
    if (typeof newData[field] === 'string' && newData[field]) { // Asegura que el campo exista y no sea null/undefined
      newData[field] = newData[field].toUpperCase();
    }
  });
  return newData;
};

/**
 * Formatea un nombre de calle, añadiendo "CALLE " si no lo tiene y convirtiendo a mayúsculas.
 * @param {string | null | undefined} streetName
 * @returns {string | null | undefined}
 */
const formatoNombreCalle = (streetName) => {
  if (!streetName) return streetName; // Retorna null/undefined si el campo está vacío
  let cleanedStreet = streetName.toLowerCase();
  if (!cleanedStreet.startsWith('calle ')) {
    return 'CALLE ' + streetName.toUpperCase();
  }
  return streetName.toUpperCase();
};

/**
 * Aplica transformaciones específicas a los datos de interferencia.
 * @param {Object} interferenciaData
 * @returns {Object}
 */
const transformacionDatos = (interferenciaData) => {
  let datoTransformado = { ...interferenciaData };

  // Eliminar espacios en blanco al inicio y al final
  datoTransformado = trimStringsInObject(datoTransformado);

  // Convertir a mayúsculas los campos específicos
  datoTransformado = camposMayuscula(datoTransformado, [
    'SOI_NOMBRE',
    'SOI_APELLIDO',
    'SOI_PISO',
    'SOI_DPTO'
  ]);

  // Formatear campos de calle
  datoTransformado.SOI_CALLE = formatoNombreCalle(datoTransformado.SOI_CALLE);
  datoTransformado.SOI_ENTRE1 = formatoNombreCalle(datoTransformado.SOI_ENTRE1);
  datoTransformado.SOI_ENTRE2 = formatoNombreCalle(datoTransformado.SOI_ENTRE2);

  // Convertir email a minúsculas
  if (typeof datoTransformado.SOI_EMAIL === 'string' && datoTransformado.SOI_EMAIL) {
    datoTransformado.SOI_EMAIL = datoTransformado.SOI_EMAIL.toLowerCase();
  }

  return datoTransformado;
};

module.exports = {
    transformacionDatos
};