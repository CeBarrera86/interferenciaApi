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
 * Convierte a minúsculas los campos de texto especificados.
 * @param {Object} data
 * @param {Array<string>} fieldsToLowercase
 * @returns {Object}
 */
const camposMinuscula = (data, fieldsToLowercase) => {
  const newData = { ...data };
  fieldsToLowercase.forEach(field => {
    if (typeof newData[field] === 'string' && newData[field]) {
      newData[field] = newData[field].toLowerCase();
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
  let cleanedStreet = streetName.trim().toUpperCase();
  if (!cleanedStreet.startsWith('CALLE ')) {
    return `CALLE ${cleanedStreet}`;
  }
  return cleanedStreet;
};

/**
 * Formatea un texto como un párrafo, con la primera letra en mayúscula y el resto en minúscula.
 * @param {string | null | undefined} text
 * @returns {string | null | undefined}
 */
const formatoParrafo = (text) => {
  if (!text) return text;
  let trimmedText = text.trim();
  if (trimmedText.length === 0) return trimmedText;
  return trimmedText.charAt(0).toUpperCase() + trimmedText.slice(1).toLowerCase();
};

/**
 * Realiza la transformación completa de los datos de un objeto basándose en un prefijo.
 * @param {Object} data - Objeto de datos a transformar.
 * @param {string} [prefix='SOI_'] - Prefijo de los campos a transformar.
 * @returns {Object}
 */
const transformacionDatos = (data, prefix = 'SOI_') => {
  let datoTransformado = { ...data };

  // Eliminar espacios en blanco al inicio y al final
  datoTransformado = trimStringsInObject(datoTransformado);

  // Mapeo de campos a sus funciones de transformación
  const transformaciones = {
    [`${prefix}NOMBRE`]: {
      uppercase: true,
      // Si el nombre de la calle necesita un prefijo, aquí lo podrías agregar
    },
    [`${prefix}APELLIDO`]: {
      uppercase: true,
    },
    [`${prefix}EMAIL`]: {
      lowercase: true,
    },
    [`${prefix}PROYECTO`]: {
      uppercase: true,
    },
    [`${prefix}DESCRIPCION`]: {
      paragraph: true,
    },
    [`${prefix}CALLE`]: {
      street: true,
    },
    [`${prefix}PISO`]: {
      uppercase: true,
    },
    [`${prefix}DPTO`]: {
      uppercase: true,
    },
    [`${prefix}ENTRE1`]: {
      street: true,
    },
    [`${prefix}ENTRE2`]: {
      street: true,
    },
    [`${prefix}USUARIO`]: {
      lowercase: true,
    },
    [`${prefix}ORIGEN`]: {
      lowercase: true,
    },
    [`${prefix}DESTINO`]: {
      lowercase: true,
    },
    [`${prefix}ASUNTO`]: {
      paragraph: true,
    },
    [`${prefix}MENSAJE`]: {
      paragraph: true,
    }
  };

  for (const key in datoTransformado) {
    if (transformaciones[key]) {
      const rules = transformaciones[key];
      if (rules.uppercase) {
        datoTransformado[key] = datoTransformado[key].toUpperCase();
      }
      if (rules.lowercase) {
        datoTransformado[key] = datoTransformado[key].toLowerCase();
      }
      if (rules.street) {
        datoTransformado[key] = formatoNombreCalle(datoTransformado[key]);
      }
      if (rules.paragraph) {
        datoTransformado[key] = formatoParrafo(datoTransformado[key]);
      }
    }
  }

  return datoTransformado;
};

module.exports = {
  transformacionDatos,
  trimStringsInObject,
  camposMayuscula,
  camposMinuscula,
  formatoNombreCalle,
  formatoParrafo
};