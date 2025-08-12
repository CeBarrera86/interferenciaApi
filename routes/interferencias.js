const express = require('express');
const router = express.Router();
const interferenciaController = require('../controllers/interferenciaController');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');

// --- Configuración de almacenamiento para multer ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- Middleware de validación para la ruta '/store' ---
const validateInterferencia = [
    body('SOI_CUIT')
        .notEmpty().withMessage('El CUIT es obligatorio.')
        .isLength({ max: 20 }).withMessage('El CUIT no puede exceder los 20 caracteres.')
        .matches(/^\d{11}$/).withMessage('El CUIT debe ser numérico de 11 dígitos.'),

    body('SOI_PERSONA')
        .notEmpty().withMessage('El tipo de persona es obligatorio.')
        .isIn(['F', 'J']).withMessage('El tipo de persona debe ser "F" (física) o "J" (jurídica).'),

    body('SOI_NOMBRE')
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ max: 50 }).withMessage('El nombre no puede exceder los 50 caracteres.')
        .matches(/^[a-zA-Z\sñÑáéíóúÁÉÍÓÚ]+$/).withMessage('El nombre solo puede contener letras y espacios.'),

    body('SOI_APELLIDO')
        .notEmpty().withMessage('El apellido es obligatorio.')
        .isLength({ max: 50 }).withMessage('El apellido no puede exceder los 50 caracteres.')
        .matches(/^[a-zA-Z\sñÑáéíóúÁÉÍÓÚ]+$/).withMessage('El apellido solo puede contener letras y espacios.'),

    body('SOI_EMAIL')
        .notEmpty().withMessage('El email es obligatorio.')
        .isEmail().withMessage('Debe ser un formato de email válido.')
        .isLength({ max: 50 }).withMessage('El email no puede exceder los 50 caracteres.'),

    body('SOI_CALLE')
        .notEmpty().withMessage('La calle es obligatoria.')
        .isLength({ max: 50 }).withMessage('La calle no puede exceder los 50 caracteres.'),

    body('SOI_ALTURA')
        .notEmpty().withMessage('La altura es obligatoria.')
        .isLength({ max: 10 }).withMessage('La altura no puede exceder los 10 caracteres.')
        .isNumeric().withMessage('La altura debe ser un valor numérico.'),

    body('SOI_PISO')
        .optional({ checkFalsy: true })
        .isLength({ max: 10 }).withMessage('El piso no puede exceder los 10 caracteres.'),

    body('SOI_DPTO')
        .optional({ checkFalsy: true })
        .isLength({ max: 10 }).withMessage('El departamento no puede exceder los 10 caracteres.'),

    body('SOI_ENTRE1')
        .optional({ checkFalsy: true })
        .isLength({ max: 50 }).withMessage('Entre calle 1 no puede exceder los 50 caracteres.'),

    body('SOI_ENTRE2')
        .optional({ checkFalsy: true })
        .isLength({ max: 50 }).withMessage('Entre calle 2 no puede exceder los 50 caracteres.'),

    body('SOI_VEREDA')
        .notEmpty().withMessage('La vereda es obligatoria.')
        .isIn(['P', 'I']).withMessage('La vereda debe ser "P" (par) o "I" (impar).'),

    body('SOI_LATITUD')
        .notEmpty().withMessage('La latitud es obligatoria.')
        .isDecimal().withMessage('La latitud debe ser un valor decimal.')
        .toFloat(),

    body('SOI_LONGITUD')
        .notEmpty().withMessage('La longitud es obligatoria.')
        .isDecimal().withMessage('La longitud debe ser un valor decimal.')
        .toFloat(),

    body('SOI_LOCALIDAD_ID')
        .notEmpty().withMessage('La localidad es obligatoria.')
        .isInt({ min: 1 }).withMessage('El ID de localidad debe ser un número entero positivo.')
        .toInt(),

    body('SOI_DESDE')
        .notEmpty().withMessage('La fecha "Desde" es obligatoria.')
        .isISO8601().withMessage('La fecha "Desde" debe ser un formato de fecha válido (ISO8601).')
        .toDate(),

    body('SOI_HASTA')
        .notEmpty().withMessage('La fecha "Hasta" es obligatoria.')
        .isISO8601().withMessage('La fecha "Hasta" debe ser un formato de fecha válido (ISO8601).')
        .toDate()
        .custom((value, { req }) => {
            if (new Date(value) < new Date(req.body.SOI_DESDE)) {
                throw new Error('La fecha "Hasta" no puede ser anterior a la fecha "Desde".');
            }
            return true;
        }),
    body('SOI_SERVICIO')
        .notEmpty().withMessage('Debe seleccionar al menos un servicio.')
        .isString().withMessage('SOI_SERVICIO debe ser una cadena de texto.')
        .customSanitizer(value => value.split(',').map(Number))
        .isArray({ min: 1 }).withMessage('Debe seleccionar al menos un servicio.')
        .custom(value => {
            // Puedes agregar validaciones adicionales aquí si es necesario,
            // por ejemplo, para asegurarte de que los IDs existan.
            return true;
        })
];

router.post('/store', upload.single('SOI_ADJUNTO'), validateInterferencia, interferenciaController.store);

module.exports = router;