import nodemailer from 'nodemailer';

import config from '../config.js';

let transporterPromise;

const ensureMailConfiguration = () => {
  if (!config.mail.host || !config.mail.user || !config.mail.password) {
    const error = new Error(
      'El servidor de correo no está configurado. Define SMTP_HOST, SMTP_USER, SMTP_PASS y SMTP_FROM.',
    );
    error.statusCode = 500;
    throw error;
  }
};

const getTransporter = async () => {
  ensureMailConfiguration();

  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: config.mail.host,
        port: config.mail.port,
        secure: config.mail.secure,
        auth: {
          user: config.mail.user,
          pass: config.mail.password,
        },
      }),
    );
  }

  return transporterPromise;
};

export const sendMail = async ({ html, subject, text, to }) => {
  const transporter = await getTransporter();

  await transporter.sendMail({
    from: config.mail.from,
    to,
    subject,
    text,
    html,
  });
};
