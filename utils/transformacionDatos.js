/**
 * Elimina espacios en blanco al inicio y al final de todas las propiedades de tipo string de un objeto.
 * @param {Object} data
 * @returns {Object}
 */
const trimStringsInObject = (data) => {
    const newData = { ...data };
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
        if (typeof newData[field] === 'string' && newData[field]) {
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
    if (!streetName) return streetName;
    let cleanedStreet = streetName.toLowerCase();
    if (!cleanedStreet.startsWith('calle ')) {
        return 'CALLE ' + streetName.toUpperCase();
    }
    return streetName.toUpperCase();
};

/**
 * Aplica transformaciones específicas a los datos de interferencia.
 * @param {Object} data - Objeto con los datos a transformar.
 * @param {string} [prefix='SOI_'] - Prefijo de los campos a transformar.
 * @returns {Object}
 */
const transformacionDatos = (data, prefix = 'SOI_') => {
    let datoTransformado = { ...data };

    // Eliminar espacios en blanco al inicio y al final
    datoTransformado = trimStringsInObject(datoTransformado);

    // Convertir a mayúsculas los campos específicos
    const fieldsToUppercase = [
        `${prefix}NOMBRE`,
        `${prefix}APELLIDO`,
        `${prefix}PISO`,
        `${prefix}DPTO`,
    ];
    datoTransformado = camposMayuscula(datoTransformado, fieldsToUppercase);

    // Formatear campos de calle
    const calleKey = `${prefix}CALLE`;
    const entre1Key = `${prefix}ENTRE1`;
    const entre2Key = `${prefix}ENTRE2`;

    if (datoTransformado[calleKey]) {
        datoTransformado[calleKey] = formatoNombreCalle(datoTransformado[calleKey]);
    }
    if (datoTransformado[entre1Key]) {
        datoTransformado[entre1Key] = formatoNombreCalle(datoTransformado[entre1Key]);
    }
    if (datoTransformado[entre2Key]) {
        datoTransformado[entre2Key] = formatoNombreCalle(datoTransformado[entre2Key]);
    }

    // Convertir email a minúsculas
    const emailKey = `${prefix}EMAIL`;
    if (typeof datoTransformado[emailKey] === 'string' && datoTransformado[emailKey]) {
        datoTransformado[emailKey] = datoTransformado[emailKey].toLowerCase();
    }

    return datoTransformado;
};

module.exports = {
    transformacionDatos
};