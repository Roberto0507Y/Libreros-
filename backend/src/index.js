import app from './app.js';
import config from './config.js';
import { testConnection } from './db.js';

const startServer = async () => {
  await testConnection();
  console.log(`Conexion a MySQL lista sobre ${config.db.database}`);

  app.listen(config.server.port, () => {
    console.log(`Servidor corriendo en http://localhost:${config.server.port}`);
  });
};

startServer().catch((error) => {
  console.error('No se pudo iniciar el servidor');
  console.error(error);
  process.exit(1);
});
