import { randomUUID } from 'node:crypto';

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import config from '../config.js';

const imageExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const normalizeFileName = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const hasAwsConfig = () =>
  Boolean(
    config.aws.region &&
      config.aws.bucketName &&
      config.aws.accessKeyId &&
      config.aws.secretAccessKey,
  );

const getS3Client = () => {
  if (!hasAwsConfig()) {
    const error = new Error(
      'Faltan variables de AWS para subir archivos. Configura AWS_REGION, AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY',
    );
    error.statusCode = 500;
    throw error;
  }

  return new S3Client({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });
};

const buildPublicUrl = (key) =>
  `https://${config.aws.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;

const getKeyFromUrl = (value) => {
  if (!value) return null;

  const prefix = `https://${config.aws.bucketName}.s3.${config.aws.region}.amazonaws.com/`;
  if (!value.startsWith(prefix)) return null;

  return value.slice(prefix.length);
};

export const uploadImageFromDataUrl = async (dataUrl, folder, entityName, invalidMessage) => {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    const error = new Error(invalidMessage);
    error.statusCode = 400;
    throw error;
  }

  const mimeType = match[1];
  const base64Payload = match[2];
  const extension = imageExtensions[mimeType];

  if (!extension) {
    const error = new Error('Solo se permiten imagenes PNG, JPG o WEBP');
    error.statusCode = 400;
    throw error;
  }

  const fileName = `${normalizeFileName(entityName) || folder}-${randomUUID()}${extension}`;
  const key = `${folder}/${fileName}`;

  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: config.aws.bucketName,
      Key: key,
      Body: Buffer.from(base64Payload, 'base64'),
      ContentType: mimeType,
    }),
  );

  return buildPublicUrl(key);
};

export const removeImage = async (value) => {
  const key = getKeyFromUrl(value);
  if (!key) return;

  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.aws.bucketName,
      Key: key,
    }),
  );
};
