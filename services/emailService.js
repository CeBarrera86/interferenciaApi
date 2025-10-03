const nodemailer = require('nodemailer');
const emailEmpresas = require('../config/emailEmpresas');

const enviarEmail = async ({ empresa, para, asunto, mensaje, datos }) => {
  if (!para || !empresa || !asunto || !datos?.idInterferencia || !datos?.nombre || !datos?.apellido) {
    console.warn('❌ Datos insuficientes para enviar el correo.');
    return false;
  }

  const config = emailEmpresas[empresa] || emailEmpresas.default;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const html = `
    <div style="background-color:#f0f8ff;padding:30px;font-family:sans-serif;">
      <h2 style="text-align:center;color:#333;">NOTIFICACIÓN</h2>
      <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:8px;">
        <p>A quien corresponda,</p>
        <p>
          Se informa que la solicitud de interferencia N°${datos.idInterferencia}
          ${datos.proyecto ? ` para el proyecto <strong>${datos.proyecto}</strong>,` : ','}
          a nombre de <strong>${datos.nombre} ${datos.apellido}</strong>, fue procesada con el siguiente mensaje:
        </p>
        <p><strong>${mensaje}</strong></p>
        <p style="margin-top:30px;">Saludos cordiales,<br><strong>${config.nombre}</strong></p>
        <hr style="margin-top:40px;">
        <p style="text-align:center;font-size:12px;color:#999;">Todos los derechos reservados © ${new Date().getFullYear()} Corpico Ltda.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"${config.nombre}" <${config.user}>`,
    to: para,
    subject: asunto,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📨 Email enviado a ${para} desde ${config.nombre}`);
    return true;
  } catch (error) {
    console.error(`💥 Error al enviar email desde ${config.nombre}:`, error.message);
    return false;
  }
};

module.exports = { enviarEmail };