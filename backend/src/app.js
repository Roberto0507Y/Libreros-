import cors from 'cors';
import express from 'express';

import config from './config.js';
import authRouter from './routes/auth.routes.js';
import cartRouter from './routes/cart.routes.js';
import catalogRouter from './routes/catalog.routes.js';
import customersRouter from './routes/customers.routes.js';
import deliveryRouter from './routes/delivery.routes.js';
import productsRouter from './routes/products.routes.js';
import salesRouter from './routes/sales.routes.js';
import usersRouter from './routes/users.routes.js';
import ordersRouter from './routes/orders.routes.js';

const app = express();
const allowedOrigins = config.cors.origins;

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
  }),
);
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    message: 'API de libreria disponible',
    database: config.db.database,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/cart', cartRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/customers', customersRouter);
app.use('/api/clientes', customersRouter);
app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/ventas', salesRouter);
app.use('/api/users', usersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api', deliveryRouter);

app.use((_req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada',
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);

  res.status(error.statusCode ?? 500).json({
    message: error.message ?? 'Ocurrio un error interno en el servidor',
  });
});

export default app;
