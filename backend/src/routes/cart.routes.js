import { Router } from 'express';

import { query, withTransaction } from '../db.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

const loadCustomerByUser = async (userId) => {
  const userRows = await query(
    `
      SELECT
        u.id_usuario,
        u.correo,
        r.nombre AS roleName
      FROM usuarios u
      INNER JOIN roles r ON r.id_rol = u.id_rol
      WHERE u.id_usuario = ?
      LIMIT 1
    `,
    [userId],
  );

  if (!userRows.length) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }

  if (userRows[0].roleName !== 'Cliente') {
    const error = new Error('Solo los clientes pueden usar el carrito en linea');
    error.statusCode = 403;
    throw error;
  }

  const customerRows = await query(
    `
      SELECT id_cliente
      FROM clientes
      WHERE correo = ?
      LIMIT 1
    `,
    [userRows[0].correo],
  );

  if (!customerRows.length) {
    const error = new Error('No existe un cliente asociado a este usuario');
    error.statusCode = 400;
    throw error;
  }

  return {
    customerId: customerRows[0].id_cliente,
  };
};

const normalizeItems = (items) => {
  const merged = new Map();

  for (const item of items) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);

    if (Number.isNaN(productId) || Number.isNaN(quantity) || quantity <= 0) {
      const error = new Error('Hay productos o cantidades invalidas en el carrito');
      error.statusCode = 400;
      throw error;
    }

    merged.set(productId, (merged.get(productId) ?? 0) + quantity);
  }

  return Array.from(merged.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
};

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const { customerId } = await loadCustomerByUser(req.user.sub);
    const rows = await query(
      `
        SELECT
          cd.id_producto AS productId,
          cd.cantidad AS quantity
        FROM carritos c
        INNER JOIN carritos_detalle cd ON cd.id_carrito = c.id_carrito
        WHERE c.id_cliente = ?
        ORDER BY cd.id_carrito_detalle
      `,
      [customerId],
    );

    res.json({
      items: rows.map((row) => ({
        productId: Number(row.productId),
        quantity: Number(row.quantity),
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.put('/', async (req, res, next) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];

  try {
    const normalizedItems = normalizeItems(items);

    const payload = await withTransaction(async (connection) => {
      const { customerId } = await loadCustomerByUser(req.user.sub);

      await connection.execute(
        `
          INSERT INTO carritos (id_cliente)
          VALUES (?)
          ON DUPLICATE KEY UPDATE fecha_actualizacion = CURRENT_TIMESTAMP
        `,
        [customerId],
      );

      const [cartRows] = await connection.execute(
        `
          SELECT id_carrito
          FROM carritos
          WHERE id_cliente = ?
          LIMIT 1
        `,
        [customerId],
      );

      const cartId = cartRows[0].id_carrito;

      await connection.execute(
        `
          DELETE FROM carritos_detalle
          WHERE id_carrito = ?
        `,
        [cartId],
      );

      for (const item of normalizedItems) {
        const [productRows] = await connection.execute(
          `
            SELECT id_producto
            FROM productos
            WHERE id_producto = ?
            LIMIT 1
          `,
          [item.productId],
        );

        if (!productRows.length) {
          const error = new Error('Uno de los productos del carrito ya no existe');
          error.statusCode = 404;
          throw error;
        }

        await connection.execute(
          `
            INSERT INTO carritos_detalle (id_carrito, id_producto, cantidad)
            VALUES (?, ?, ?)
          `,
          [cartId, item.productId, item.quantity],
        );
      }

      return normalizedItems;
    });

    res.json({
      message: 'Carrito actualizado correctamente',
      items: payload,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    await withTransaction(async (connection) => {
      const { customerId } = await loadCustomerByUser(req.user.sub);
      const [cartRows] = await connection.execute(
        `
          SELECT id_carrito
          FROM carritos
          WHERE id_cliente = ?
          LIMIT 1
        `,
        [customerId],
      );

      if (!cartRows.length) {
        return;
      }

      await connection.execute(
        `
          DELETE FROM carritos_detalle
          WHERE id_carrito = ?
        `,
        [cartRows[0].id_carrito],
      );
    });

    res.json({
      message: 'Carrito limpiado correctamente',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
