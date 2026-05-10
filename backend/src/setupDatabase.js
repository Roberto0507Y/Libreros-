import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import mysql from 'mysql2/promise';

import config from './config.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(currentDirectory, '..', 'sql', 'schema.sql');

const run = async () => {
  const rawSchema = await fs.readFile(schemaPath, 'utf8');
  const databaseName = `\`${config.db.database.replaceAll('`', '')}\``;
  const schema = rawSchema.replaceAll('__DB_NAME__', databaseName);
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  try {
    await connection.query(schema);
    console.log(`Base de datos ${config.db.database} preparada correctamente`);
  } finally {
    await connection.end();
  }
};

run().catch((error) => {
  console.error('No se pudo preparar la base de datos');
  console.error(error);
  process.exit(1);
});
