import { Router } from 'express';

import { query, withTransaction } from '../db.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

const ORDER_TIMELINE = {
  pedidoRecibido: 'pedido_recibido',
  pagoConfirmado: 'pago_confirmado',
};

const buildTrackingCode = (orderId, issuedAt = new Date()) => {
  const year = issuedAt.getFullYear();
  const month = String(issuedAt.getMonth() + 1).padStart(2, '0');
  const day = String(issuedAt.getDate()).padStart(2, '0');

  return `TRK-${year}${month}${day}-${String(orderId).padStart(4, '0')}`;
};

const insertOrderStatusHistory = async (connection, { orderId, status, description, userId = null }) => {
  await connection.execute(
    `
      INSERT INTO pedido_estados_historial (
        id_pedido,
        estado,
        descripcion,
        usuario_id
      )
      VALUES (?, ?, ?, ?)
    `,
    [orderId, status, description || null, userId],
  );
};

router.use(authenticateToken);

router.post('/', async (req, res, next) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const delivery =
    req.body.delivery && typeof req.body.delivery === 'object' ? req.body.delivery : {};

  if (!items.length) {
    return res.status(400).json({
      message: 'Debes agregar al menos un producto al carrito',
    });
  }

  try {
    const order = await withTransaction(async (connection) => {
      const [userRows] = await connection.execute(
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
        [req.user.sub],
      );

      if (!userRows.length) {
        const error = new Error('Usuario no encontrado');
        error.statusCode = 404;
        throw error;
      }

      if (userRows[0].roleName !== 'Cliente') {
        const error = new Error('Solo los clientes pueden comprar en linea');
        error.statusCode = 403;
        throw error;
      }

      const [customerRows] = await connection.execute(
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

      const customerId = customerRows[0].id_cliente;
      const normalizedItems = items.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
      }));

      if (
        normalizedItems.some(
          (item) => Number.isNaN(item.productId) || Number.isNaN(item.quantity) || item.quantity <= 0,
        )
      ) {
        const error = new Error('Hay productos o cantidades invalidas en el carrito');
        error.statusCode = 400;
        throw error;
      }

      const shippingCost = Math.max(0, Number(delivery.shippingCost ?? 0) || 0);
      const estimatedMinutes = Number(delivery.estimatedMinutes ?? 0);
      const sanitizedDelivery = {
        address: String(delivery.address ?? '').trim() || null,
        reference: String(delivery.reference ?? '').trim() || null,
        zone: String(delivery.zone ?? '').trim() || null,
        phone: String(delivery.phone ?? '').trim() || null,
        recipientName: String(delivery.recipientName ?? '').trim() || null,
        estimatedMinutes:
          Number.isFinite(estimatedMinutes) && estimatedMinutes > 0
            ? Math.round(estimatedMinutes)
            : null,
      };

      const [orderResult] = await connection.execute(
        `
          INSERT INTO pedidos (
            id_cliente,
            estado,
            estado_pedido,
            estado_entrega,
            tracking_code,
            direccion_entrega,
            referencia_entrega,
            zona_entrega,
            telefono_entrega,
            nombre_recibe,
            tiempo_estimado_minutos,
            costo_envio,
            total
          )
          VALUES (?, 'confirmado', ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 0)
        `,
        [
          customerId,
          ORDER_TIMELINE.pagoConfirmado,
          ORDER_TIMELINE.pagoConfirmado,
          sanitizedDelivery.address,
          sanitizedDelivery.reference,
          sanitizedDelivery.zone,
          sanitizedDelivery.phone,
          sanitizedDelivery.recipientName,
          sanitizedDelivery.estimatedMinutes,
          shippingCost,
        ],
      );

      const orderId = orderResult.insertId;
      const trackingCode = buildTrackingCode(orderId);
      let productsTotal = 0;

      for (const item of normalizedItems) {
        const [productRows] = await connection.execute(
          `
            SELECT
              p.id_producto,
              p.nombre,
              p.precio_venta,
              COALESCE(i.stock, 0) AS stock
            FROM productos p
            LEFT JOIN inventario i ON i.id_producto = p.id_producto
            WHERE p.id_producto = ?
            LIMIT 1
            FOR UPDATE
          `,
          [item.productId],
        );

        if (!productRows.length) {
          const error = new Error('Uno de los productos del carrito ya no existe');
          error.statusCode = 404;
          throw error;
        }

        const product = productRows[0];

        if (Number(product.stock) < item.quantity) {
          const error = new Error(`No hay suficiente disponibilidad para ${product.nombre}`);
          error.statusCode = 400;
          throw error;
        }

        const subtotal = Number(product.precio_venta) * item.quantity;
        productsTotal += subtotal;

        await connection.execute(
          `
            INSERT INTO pedidos_detalle (
              id_pedido,
              id_producto,
              cantidad,
              precio_unitario,
              subtotal
            )
            VALUES (?, ?, ?, ?, ?)
          `,
          [orderId, item.productId, item.quantity, product.precio_venta, subtotal],
        );

        await connection.execute(
          `
            UPDATE inventario
            SET stock = stock - ?
            WHERE id_producto = ?
          `,
          [item.quantity, item.productId],
        );

        await connection.execute(
          `
            INSERT INTO movimientos_inventario (
              id_producto,
              tipo,
              cantidad,
              referencia,
              id_referencia
            )
            VALUES (?, 'salida', ?, 'pedido_online', ?)
          `,
          [item.productId, item.quantity, orderId],
        );
      }

      const grandTotal = productsTotal + shippingCost;

      await connection.execute(
        `
          UPDATE pedidos
          SET total = ?, tracking_code = ?
          WHERE id_pedido = ?
        `,
        [grandTotal, trackingCode, orderId],
      );

      await insertOrderStatusHistory(connection, {
        orderId,
        status: ORDER_TIMELINE.pedidoRecibido,
        description: 'Pedido recibido y validado correctamente.',
        userId: req.user.sub,
      });

      await insertOrderStatusHistory(connection, {
        orderId,
        status: ORDER_TIMELINE.pagoConfirmado,
        description: 'Pago confirmado. Tu pedido ya está en preparación.',
        userId: req.user.sub,
      });

      try {
        const [cartRows] = await connection.execute(
          `
            SELECT id_carrito
            FROM carritos
            WHERE id_cliente = ?
            LIMIT 1
          `,
          [customerId],
        );

        if (cartRows.length) {
          await connection.execute(
            `
              DELETE FROM carritos_detalle
              WHERE id_carrito = ?
            `,
            [cartRows[0].id_carrito],
          );
        }
      } catch (cartCleanupError) {
        if (cartCleanupError?.code !== 'ER_NO_SUCH_TABLE') {
          throw cartCleanupError;
        }
      }

      return {
        id: orderId,
        total: grandTotal,
        trackingCode,
        status: ORDER_TIMELINE.pagoConfirmado,
      };
    });

    res.status(201).json({
      message: 'Pedido creado correctamente',
      order,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/mine', async (req, res, next) => {
  try {
    const rows = await query(
      `
        SELECT
          p.id_pedido AS id,
          p.estado,
          p.estado_pedido AS estadoPedido,
          p.estado_entrega AS estadoEntrega,
          p.tracking_code AS trackingCode,
          p.direccion_entrega AS direccionEntrega,
          p.referencia_entrega AS referenciaEntrega,
          p.zona_entrega AS zonaEntrega,
          p.telefono_entrega AS telefonoEntrega,
          p.nombre_recibe AS nombreRecibe,
          p.tiempo_estimado_minutos AS tiempoEstimadoMinutos,
          p.costo_envio AS costoEnvio,
          p.total,
          p.fecha
        FROM pedidos p
        INNER JOIN clientes c ON c.id_cliente = p.id_cliente
        INNER JOIN usuarios u ON u.correo = c.correo
        WHERE u.id_usuario = ?
        ORDER BY p.fecha DESC, p.id_pedido DESC
      `,
      [req.user.sub],
    );

    res.json({
      orders: rows.map((row) => ({
        ...row,
        costoEnvio: Number(row.costoEnvio ?? 0),
        tiempoEstimadoMinutos:
          row.tiempoEstimadoMinutos !== null ? Number(row.tiempoEstimadoMinutos) : null,
        total: Number(row.total),
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
