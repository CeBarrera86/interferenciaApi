const nodemailer = require('nodemailer');

const enviarEmailConfirmacion = async ({ destinatario, nombre, apellido, proyecto, idInterferencia }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: { user: process.env.EMAIL_AUTOMATICO_USER, pass: process.env.EMAIL_AUTOMATICO_PASS, },
  });

  const asunto = `Confirmación de solicitud de interferencia`;
  const html = `
    <div style="background-color:#f0f8ff;padding:30px;font-family:sans-serif;">
      <h2 style="text-align:center;color:#333;">NOTIFICACIÓN</h2>
      <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:8px;">
        <p>A quien corresponda,</p>
        <p>
          Se informa que la solicitud de interferencia N°${idInterferencia}
          ${proyecto ? ` para el proyecto <strong>${proyecto}</strong>,` : ','}
          a nombre de <strong>${nombre} ${apellido}</strong>, fue registrada exitosamente.
        </p>
        <p style="margin-top:30px;">Saludos cordiales,<br><strong>CORPICO LTDA.</strong></p>
        <hr style="margin-top:40px;">
        <p style="text-align:center;font-size:12px;color:#999;">Todos los derechos reservados © ${new Date().getFullYear()} Corpico Ltda.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_AUTOMATICO_FROM}" <${process.env.EMAIL_AUTOMATICO_USER}>`,
    to: destinatario,
    subject: asunto,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = { enviarEmailConfirmacion };