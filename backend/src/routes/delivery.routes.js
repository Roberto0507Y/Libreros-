import { Router } from 'express';

import { query, withTransaction } from '../db.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

const ADMIN_ROLES = new Set(['Administrador', 'Director']);
const DELIVERY_ROLE = 'Repartidor';
const ORDER_TIMELINE = [
  'pedido_recibido',
  'pago_confirmado',
  'preparando_pedido',
  'pedido_despachado',
  'repartidor_en_camino',
  'repartidor_cerca',
  'entregado',
];

const ORDER_STATUS_LABELS = {
  pedido_recibido: 'Pedido recibido',
  pago_confirmado: 'Pago confirmado',
  preparando_pedido: 'Preparando pedido',
  pedido_despachado: 'Pedido despachado',
  repartidor_en_camino: 'Repartidor en camino',
  repartidor_cerca: 'Repartidor cerca',
  entregado: 'Entregado',
};

const ORDER_STATUS_MESSAGES = {
  pedido_recibido: 'Tu pedido fue recibido correctamente.',
  pago_confirmado: 'Tu pago fue confirmado y el pedido está por prepararse.',
  preparando_pedido: 'Estamos preparando tu pedido para despacho.',
  pedido_despachado: 'Tu pedido salió del centro de despacho.',
  repartidor_en_camino: 'El repartidor ya va en camino hacia tu dirección.',
  repartidor_cerca: 'El repartidor está muy cerca de tu ubicación.',
  entregado: 'Tu pedido fue entregado correctamente.',
};

const statusIndexMap = new Map(ORDER_TIMELINE.map((status, index) => [status, index]));

const formatOrderStatus = (status) => ({
  code: status,
  label: ORDER_STATUS_LABELS[status] ?? status,
  message: ORDER_STATUS_MESSAGES[status] ?? 'Sigue el avance de tu pedido.',
});

const requireAdmin = (req, res, next) => {
  if (!ADMIN_ROLES.has(req.user?.role)) {
    return res.status(403).json({
      message: 'Solo un administrador puede gestionar entregas',
    });
  }

  return next();
};

const requireDeliveryUser = (req, res, next) => {
  if (req.user?.role !== DELIVERY_ROLE) {
    return res.status(403).json({
      message: 'Solo un repartidor puede acceder a sus entregas',
    });
  }

  return next();
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

const mapOrderRows = (rows) => {
  const orders = new Map();

  for (const row of rows) {
    if (!orders.has(row.id)) {
      orders.set(row.id, {
        id: Number(row.id),
        trackingCode: row.trackingCode,
        fecha: row.fecha,
        updatedAt: row.updatedAt,
        deliveredAt: row.deliveredAt,
        cliente: {
          nombre: row.clienteNombre?.trim() || 'Consumidor Final',
          nit: row.nit || 'CF',
          telefono: row.telefonoCliente || row.telefonoEntrega || '',
        },
        repartidor: row.repartidorId
          ? {
              id: Number(row.repartidorId),
              nombre: row.repartidorNombre?.trim() || 'Repartidor asignado',
            }
          : null,
        direccionEntrega: row.direccionEntrega || '',
        referenciaEntrega: row.referenciaEntrega || '',
        zonaEntrega: row.zonaEntrega || '',
        nombreRecibe: row.nombreRecibe || '',
        telefonoEntrega: row.telefonoEntrega || '',
        tiempoEstimadoMinutos:
          row.tiempoEstimadoMinutos !== null ? Number(row.tiempoEstimadoMinutos) : null,
        costoEnvio: Number(row.costoEnvio ?? 0),
        total: Number(row.total ?? 0),
        estadoPedido: row.estadoPedido,
        estadoEntrega: row.estadoEntrega,
        estado: formatOrderStatus(row.estadoPedido),
        productos: [],
      });
    }

    if (row.productoId) {
      orders.get(row.id).productos.push({
        productoId: Number(row.productoId),
        nombre: row.productoNombre,
        cantidad: Number(row.cantidad ?? 0),
        precioUnitario: Number(row.precioUnitario ?? 0),
        subtotal: Number(row.subtotalProducto ?? 0),
      });
    }
  }

  return Array.from(orders.values());
};

const getOrdersBaseQuery = (extraWhere = '1 = 1') => `
  SELECT
    p.id_pedido AS id,
    p.tracking_code AS trackingCode,
    p.fecha,
    p.updated_at AS updatedAt,
    p.estado_pedido AS estadoPedido,
    p.estado_entrega AS estadoEntrega,
    p.direccion_entrega AS direccionEntrega,
    p.referencia_entrega AS referenciaEntrega,
    p.zona_entrega AS zonaEntrega,
    p.telefono_entrega AS telefonoEntrega,
    p.nombre_recibe AS nombreRecibe,
    p.tiempo_estimado_minutos AS tiempoEstimadoMinutos,
    p.costo_envio AS costoEnvio,
    p.total,
    p.repartidor_id AS repartidorId,
    delivered.delivered_at AS deliveredAt,
    CONCAT_WS(' ', COALESCE(c.nombres, ''), COALESCE(c.apellidos, '')) AS clienteNombre,
    COALESCE(NULLIF(TRIM(c.nit), ''), 'CF') AS nit,
    COALESCE(c.telefono, '') AS telefonoCliente,
    ur.nombre_usuario AS repartidorNombre,
    pd.id_producto AS productoId,
    pr.nombre AS productoNombre,
    pd.cantidad,
    pd.precio_unitario AS precioUnitario,
    pd.subtotal AS subtotalProducto
  FROM pedidos p
  INNER JOIN clientes c ON c.id_cliente = p.id_cliente
  LEFT JOIN usuarios ur ON ur.id_usuario = p.repartidor_id
  LEFT JOIN (
    SELECT
      id_pedido,
      MAX(created_at) AS delivered_at
    FROM pedido_estados_historial
    WHERE estado = 'entregado'
    GROUP BY id_pedido
  ) delivered ON delivered.id_pedido = p.id_pedido
  LEFT JOIN pedidos_detalle pd ON pd.id_pedido = p.id_pedido
  LEFT JOIN productos pr ON pr.id_producto = pd.id_producto
  WHERE ${extraWhere}
  ORDER BY p.fecha DESC, p.id_pedido DESC, pd.id_pedido_detalle ASC
`;

router.get('/tracking/:trackingCode', async (req, res, next) => {
  const trackingCode = String(req.params.trackingCode ?? '').trim();

  if (!trackingCode) {
    return res.status(400).json({
      message: 'Debes indicar un código de seguimiento válido.',
    });
  }

  try {
    const [orderRows, historyRows] = await Promise.all([
      query(getOrdersBaseQuery('p.tracking_code = ?'), [trackingCode]),
      query(
        `
          SELECT
            estado,
            descripcion,
            created_at AS createdAt
          FROM pedido_estados_historial
          WHERE id_pedido = (
            SELECT id_pedido
            FROM pedidos
            WHERE tracking_code = ?
            LIMIT 1
          )
          ORDER BY created_at ASC, id_historial ASC
        `,
        [trackingCode],
      ),
    ]);

    if (!orderRows.length) {
      return res.status(404).json({
        message: 'No encontramos un pedido con ese código de seguimiento.',
      });
    }

    const [order] = mapOrderRows(orderRows);

    return res.json({
      order: {
        ...order,
        historial: historyRows.map((entry) => ({
          ...formatOrderStatus(entry.estado),
          descripcion: entry.descripcion,
          createdAt: entry.createdAt,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.use(authenticateToken);

router.get('/admin/pedidos', requireAdmin, async (req, res, next) => {
  const rawQuery = String(req.query.q ?? '').trim();
  const status = String(req.query.status ?? '').trim();
  const filters = [];
  const params = [];

  if (status && ORDER_TIMELINE.includes(status)) {
    filters.push('p.estado_pedido = ?');
    params.push(status);
  }

  if (rawQuery) {
    filters.push(
      `(p.tracking_code LIKE ? OR CONCAT_WS(' ', c.nombres, c.apellidos) LIKE ? OR COALESCE(c.nit, '') LIKE ? OR COALESCE(pr.nombre, '') LIKE ?)`,
    );
    params.push(`%${rawQuery}%`, `%${rawQuery}%`, `%${rawQuery}%`, `%${rawQuery}%`);
  }

  try {
    const rows = await query(getOrdersBaseQuery(filters.length ? filters.join(' AND ') : '1 = 1'), params);

    res.json({
      orders: mapOrderRows(rows),
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/admin/pedidos/:id/asignar-repartidor', requireAdmin, async (req, res, next) => {
  const orderId = Number(req.params.id);
  const deliveryUserId = Number(req.body.repartidorId);

  if (Number.isNaN(orderId) || Number.isNaN(deliveryUserId)) {
    return res.status(400).json({
      message: 'Debes indicar un pedido y un repartidor válidos.',
    });
  }

  try {
    const payload = await withTransaction(async (connection) => {
      const [[orderRows], [userRows]] = await Promise.all([
        connection.execute(
          `
            SELECT id_pedido, estado_pedido, repartidor_id
            FROM pedidos
            WHERE id_pedido = ?
            LIMIT 1
            FOR UPDATE
          `,
          [orderId],
        ),
        connection.execute(
          `
            SELECT u.id_usuario, u.nombre_usuario, r.nombre AS roleName
            FROM usuarios u
            INNER JOIN roles r ON r.id_rol = u.id_rol
            WHERE u.id_usuario = ?
            LIMIT 1
          `,
          [deliveryUserId],
        ),
      ]);

      if (!orderRows.length) {
        const error = new Error('Pedido no encontrado.');
        error.statusCode = 404;
        throw error;
      }

      if (!userRows.length || userRows[0].roleName !== DELIVERY_ROLE) {
        const error = new Error('El usuario seleccionado no tiene rol de repartidor.');
        error.statusCode = 400;
        throw error;
      }

      await connection.execute(
        `
          UPDATE pedidos
          SET repartidor_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id_pedido = ?
        `,
        [deliveryUserId, orderId],
      );

      await insertOrderStatusHistory(connection, {
        orderId,
        status: orderRows[0].estado_pedido,
        description: `Pedido asignado al repartidor ${userRows[0].nombre_usuario}.`,
        userId: req.user.sub,
      });

      return {
        deliveryUserId,
        deliveryUserName: userRows[0].nombre_usuario,
        orderId,
      };
    });

    res.json({
      message: `Pedido #${payload.orderId} asignado a ${payload.deliveryUserName}.`,
      assignment: payload,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/repartidor/pedidos', requireDeliveryUser, async (req, res, next) => {
  try {
    const rows = await query(getOrdersBaseQuery('p.repartidor_id = ?'), [req.user.sub]);

    res.json({
      orders: mapOrderRows(rows),
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/repartidor/pedidos/:id/estado', requireDeliveryUser, async (req, res, next) => {
  const orderId = Number(req.params.id);
  const nextStatus = String(req.body.estado ?? '').trim();

  if (Number.isNaN(orderId) || !ORDER_TIMELINE.includes(nextStatus)) {
    return res.status(400).json({
      message: 'Debes indicar un pedido y un estado válidos.',
    });
  }

  try {
    const payload = await withTransaction(async (connection) => {
      const [orderRows] = await connection.execute(
        `
          SELECT id_pedido, estado_pedido, repartidor_id
          FROM pedidos
          WHERE id_pedido = ?
          LIMIT 1
          FOR UPDATE
        `,
        [orderId],
      );

      if (!orderRows.length) {
        const error = new Error('Pedido no encontrado.');
        error.statusCode = 404;
        throw error;
      }

      const order = orderRows[0];

      if (Number(order.repartidor_id) !== Number(req.user.sub)) {
        const error = new Error('No puedes actualizar pedidos asignados a otro repartidor.');
        error.statusCode = 403;
        throw error;
      }

      const currentIndex = statusIndexMap.get(order.estado_pedido) ?? -1;
      const nextIndex = statusIndexMap.get(nextStatus) ?? -1;

      if (nextIndex <= currentIndex) {
        const error = new Error('No puedes volver a un estado anterior ni repetir el estado actual.');
        error.statusCode = 400;
        throw error;
      }

      await connection.execute(
        `
          UPDATE pedidos
          SET estado_pedido = ?, estado_entrega = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id_pedido = ?
        `,
        [nextStatus, nextStatus, orderId],
      );

      await insertOrderStatusHistory(connection, {
        orderId,
        status: nextStatus,
        description: ORDER_STATUS_MESSAGES[nextStatus],
        userId: req.user.sub,
      });

      return {
        orderId,
        status: formatOrderStatus(nextStatus),
      };
    });

    res.json({
      message: `Estado actualizado a ${payload.status.label}.`,
      order: payload,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
