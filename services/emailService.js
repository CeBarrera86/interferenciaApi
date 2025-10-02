const nodemailer = require('nodemailer');

const enviarEmailManual = async ({ para, de, asunto, mensaje, adjuntos = [] }) => {
  if (!para || !de?.user || !de?.pass) return false;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: de.user,
      pass: de.pass,
    },
  });

  const mailOptions = {
    from: `"${de.nombre}" <${de.user}>`,
    to: para,
    subject: asunto,
    text: mensaje,
    attachments: adjuntos.map(file => ({
      filename: file.nombre,
      path: file.ruta,
    })),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📨 Email manual enviado a ${para} desde ${de.nombre}`);
    return true;
  } catch (error) {
    console.error('💥 Error al enviar email manual:', error.message);
    return false;
  }
};

module.exports = { enviarEmailManual };