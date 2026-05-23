import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

const parseOrigins = (value, fallbackOrigin) => {
  if (!value) {
    return [fallbackOrigin];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const config = {
  server: {
    port: Number(process.env.PORT ?? 2000),
  },
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASS ?? '',
    database: process.env.DB_NAME ?? 'db_libreria',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? 'cambia-esta-clave-en-produccion',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
    passwordResetExpiresMinutes: Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES ?? 60),
  },
  app: {
    frontendUrl: process.env.FRONTEND_URL ?? DEFAULT_FRONTEND_URL,
  },
  cors: {
    origins: parseOrigins(
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL ?? DEFAULT_FRONTEND_URL,
    ),
  },
  aws: {
    region: process.env.AWS_REGION ?? '',
    bucketName: process.env.AWS_BUCKET_NAME ?? '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
  mail: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: String(process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true',
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'no-reply@libreriadigital.local',
  },
};

export default config;
