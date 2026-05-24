import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';
import { query } from '../db.js';

const router = Router();

router.use(authenticateToken);

const customerSelect = `
  SELECT
    id_cliente AS id,
    CONCAT(nombres, ' ', apellidos) AS name,
    nit,
    telefono,
    correo,
    created_at AS createdAt
  FROM clientes
`;

const normalizeNit = (value) => String(value ?? '').trim().toUpperCase();

const splitFullName = (fullName) => {
  const normalized = String(fullName ?? '').trim().replace(/\s+/g, ' ');

  if (!normalized) {
    return {
      firstName: '',
      lastName: '',
    };
  }

  const [firstName, ...lastNameParts] = normalized.split(' ');

  return {
    firstName,
    lastName: lastNameParts.join(' ').trim() || 'Cliente',
  };
};

const CUSTOMER_ROLE = 'Cliente';

const getCustomerAccountContext = async (userId) => {
  const rows = await query(
    `
      SELECT
        u.id_usuario AS userId,
        u.nombre_usuario AS username,
        u.correo AS email,
        r.nombre AS roleName,
        c.id_cliente AS customerId,
        c.nombres AS firstName,
        c.apellidos AS lastName,
        c.nit,
        c.telefono AS phone,
        c.correo AS customerEmail,
        c.created_at AS createdAt
      FROM usuarios u
      INNER JOIN roles r ON r.id_rol = u.id_rol
      LEFT JOIN clientes c ON c.correo = u.correo
      WHERE u.id_usuario = ?
      LIMIT 1
    `,
    [userId],
  );

  return rows[0] ?? null;
};

const normalizeOrderStatus = (status) => String(status ?? '').trim();

const getOrderStatusLabel = (status) => {
  const labels = {
    pedido_recibido: 'Pedido recibido',
    pago_confirmado: 'Pago confirmado',
    preparando_pedido: 'Preparando pedido',
    pedido_despachado: 'Pedido despachado',
    repartidor_en_camino: 'Repartidor en camino',
    repartidor_cerca: 'Repartidor cerca',
    entregado: 'Entregado',
  };

  return labels[normalizeOrderStatus(status)] ?? 'En proceso';
};

const buildOrderCode = (orderId, issuedAt) => {
  const date = new Date(issuedAt);
  const year = date.getFullYear();
  return `ORD-${year}-${String(orderId).padStart(4, '0')}`;
};

router.get('/', async (_req, res, next) => {
  try {
    const rows = await query(`${customerSelect} ORDER BY nombres, apellidos`);

    res.json({
      customers: rows,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me/dashboard', async (req, res, next) => {
  try {
    const context = await getCustomerAccountContext(req.user.sub);

    if (!context) {
      return res.status(404).json({
        message: 'No se encontró la cuenta del cliente.',
      });
    }

    if (context.roleName !== CUSTOMER_ROLE) {
      return res.status(403).json({
        message: 'Solo los clientes pueden acceder a este módulo.',
      });
    }

    if (!context.customerId) {
      return res.status(404).json({
        message: 'No existe un cliente asociado a esta cuenta.',
      });
    }

    const orders = await query(
      `
        SELECT
          p.id_pedido AS id,
          p.fecha AS createdAt,
          p.total,
          p.costo_envio AS shippingCost,
          p.estado_pedido AS orderStatus,
          p.estado_entrega AS deliveryStatus,
          p.tracking_code AS trackingCode,
          p.direccion_entrega AS address,
          p.referencia_entrega AS reference,
          p.zona_entrega AS zone,
          p.nombre_recibe AS recipientName,
          p.telefono_entrega AS phone,
          p.tiempo_estimado_minutos AS estimatedMinutes
        FROM pedidos p
        WHERE p.id_cliente = ?
        ORDER BY p.fecha DESC, p.id_pedido DESC
      `,
      [context.customerId],
    );

    const orderIds = orders.map((order) => order.id);
    const productRows = orderIds.length
      ? await query(
          `
            SELECT
              pd.id_pedido AS orderId,
              pd.id_producto AS productId,
              pd.cantidad AS quantity,
              pd.precio_unitario AS unitPrice,
              pd.subtotal,
              pr.nombre,
              pr.imagen AS image,
              COALESCE(m.nombre, 'Sin marca') AS brandName
            FROM pedidos_detalle pd
            INNER JOIN productos pr ON pr.id_producto = pd.id_producto
            LEFT JOIN marcas m ON m.id_marca = pr.id_marca
            WHERE pd.id_pedido IN (${orderIds.map(() => '?').join(',')})
            ORDER BY pd.id_pedido DESC, pd.id_pedido_detalle ASC
          `,
          orderIds,
        )
      : [];

    const productsByOrder = new Map();

    for (const row of productRows) {
      const current = productsByOrder.get(row.orderId) ?? [];
      current.push({
        productId: Number(row.productId),
        name: row.nombre,
        brandName: row.brandName,
        image: row.image,
        quantity: Number(row.quantity),
        unitPrice: Number(row.unitPrice),
        subtotal: Number(row.subtotal),
      });
      productsByOrder.set(row.orderId, current);
    }

    const normalizedOrders = orders.map((order) => {
      const items = productsByOrder.get(order.id) ?? [];
      const normalizedDeliveryStatus = normalizeOrderStatus(order.deliveryStatus || order.orderStatus);

      return {
        id: Number(order.id),
        orderCode: buildOrderCode(order.id, order.createdAt),
        trackingCode: order.trackingCode,
        createdAt: order.createdAt,
        total: Number(order.total),
        shippingCost: Number(order.shippingCost ?? 0),
        orderStatus: normalizeOrderStatus(order.orderStatus),
        deliveryStatus: normalizedDeliveryStatus,
        deliveryStatusLabel: getOrderStatusLabel(normalizedDeliveryStatus),
        address: order.address,
        reference: order.reference,
        zone: order.zone,
        recipientName: order.recipientName,
        phone: order.phone,
        estimatedMinutes:
          order.estimatedMinutes !== null ? Number(order.estimatedMinutes) : null,
        items,
      };
    });

    const addressMap = new Map();

    for (const order of normalizedOrders) {
      if (!order.address) {
        continue;
      }

      const key = [
        order.address,
        order.zone ?? '',
        order.reference ?? '',
        order.recipientName ?? '',
        order.phone ?? '',
      ].join('|');

      const current = addressMap.get(key);

      if (!current) {
        addressMap.set(key, {
          id: key,
          label: order.zone || 'Dirección de entrega',
          address: order.address,
          zone: order.zone,
          reference: order.reference,
          recipientName: order.recipientName,
          phone: order.phone,
          lastUsedAt: order.createdAt,
          ordersCount: 1,
        });
      } else {
        current.ordersCount += 1;

        if (new Date(order.createdAt).getTime() > new Date(current.lastUsedAt).getTime()) {
          current.lastUsedAt = order.createdAt;
          current.label = order.zone || current.label;
          current.reference = order.reference;
          current.recipientName = order.recipientName;
          current.phone = order.phone;
        }
      }
    }

    const addresses = Array.from(addressMap.values()).sort(
      (left, right) => new Date(right.lastUsedAt).getTime() - new Date(left.lastUsedAt).getTime(),
    );

    const summary = {
      totalOrders: normalizedOrders.length,
      totalSpent: normalizedOrders.reduce((sum, order) => sum + order.total, 0),
      activeOrders: normalizedOrders.filter((order) => order.deliveryStatus !== 'entregado').length,
      deliveredOrders: normalizedOrders.filter((order) => order.deliveryStatus === 'entregado').length,
      savedAddresses: addresses.length,
    };

    res.json({
      summary,
      profile: {
        id: Number(context.customerId),
        username: context.username,
        email: context.customerEmail || context.email,
        firstName: context.firstName,
        lastName: context.lastName,
        fullName: `${context.firstName} ${context.lastName}`.trim(),
        phone: context.phone,
        nit: context.nit,
        createdAt: context.createdAt,
      },
      orders: normalizedOrders,
      addresses,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/me', async (req, res, next) => {
  const fullName = String(req.body.fullName ?? '').trim();
  const phone = String(req.body.phone ?? '').trim();
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const nit = normalizeNit(req.body.nit);

  if (!fullName || !email) {
    return res.status(400).json({
      message: 'Debes completar nombre y correo.',
    });
  }

  if (!email.includes('@') || email.length < 6) {
    return res.status(400).json({
      message: 'Debes ingresar un correo válido.',
    });
  }

  try {
    const context = await getCustomerAccountContext(req.user.sub);

    if (!context) {
      return res.status(404).json({
        message: 'No se encontró la cuenta del cliente.',
      });
    }

    if (context.roleName !== CUSTOMER_ROLE) {
      return res.status(403).json({
        message: 'Solo los clientes pueden actualizar sus datos.',
      });
    }

    if (!context.customerId) {
      return res.status(404).json({
        message: 'No existe un cliente asociado a esta cuenta.',
      });
    }

    if (email !== context.email) {
      const existingUsers = await query(
        `
          SELECT id_usuario
          FROM usuarios
          WHERE correo = ? AND id_usuario <> ?
          LIMIT 1
        `,
        [email, req.user.sub],
      );

      if (existingUsers.length) {
        return res.status(409).json({
          message: 'Ese correo ya está registrado en otra cuenta.',
        });
      }
    }

    if (nit) {
      const existingNitRows = await query(
        `
          SELECT id_cliente
          FROM clientes
          WHERE UPPER(TRIM(COALESCE(nit, ''))) = ? AND id_cliente <> ?
          LIMIT 1
        `,
        [nit, context.customerId],
      );

      if (existingNitRows.length) {
        return res.status(409).json({
          message: 'Ese NIT ya está registrado en otra cuenta.',
        });
      }
    }

    const { firstName, lastName } = splitFullName(fullName);

    await withTransaction(async (connection) => {
      await connection.execute(
        `
          UPDATE usuarios
          SET correo = ?
          WHERE id_usuario = ?
        `,
        [email, req.user.sub],
      );

      await connection.execute(
        `
          UPDATE clientes
          SET
            nombres = ?,
            apellidos = ?,
            telefono = ?,
            correo = ?,
            nit = ?
          WHERE id_cliente = ?
        `,
        [firstName, lastName, phone || null, email, nit || null, context.customerId],
      );
    });

    const refreshedContext = await getCustomerAccountContext(req.user.sub);

    res.json({
      message: 'Tus datos fueron actualizados correctamente.',
      profile: {
        id: Number(refreshedContext.customerId),
        username: refreshedContext.username,
        email: refreshedContext.customerEmail || refreshedContext.email,
        firstName: refreshedContext.firstName,
        lastName: refreshedContext.lastName,
        fullName: `${refreshedContext.firstName} ${refreshedContext.lastName}`.trim(),
        phone: refreshedContext.phone,
        nit: refreshedContext.nit,
        createdAt: refreshedContext.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res, next) => {
  const rawQuery = String(req.query.q ?? '').trim();
  const mode = String(req.query.mode ?? 'all')
    .trim()
    .toLowerCase();
  const normalizedQuery = normalizeNit(rawQuery);

  try {
    if (mode === 'nit') {
      const rows = await query(
        `
          ${customerSelect}
          WHERE
            ? = ''
            OR UPPER(COALESCE(nit, '')) LIKE ?
          ORDER BY nombres, apellidos
          LIMIT 20
        `,
        [normalizedQuery, `%${normalizedQuery}%`],
      );

      return res.json({
        customers: rows,
      });
    }

    const rows = await query(
      `
        ${customerSelect}
        WHERE
          ? = ''
          OR CONCAT(nombres, ' ', apellidos) LIKE ?
          OR COALESCE(telefono, '') LIKE ?
          OR COALESCE(nit, '') LIKE ?
        ORDER BY
          CASE
            WHEN UPPER(COALESCE(nit, '')) = 'CF' THEN 0
            ELSE 1
          END,
          nombres,
          apellidos
        LIMIT 20
      `,
      [
        rawQuery,
        `%${rawQuery}%`,
        `%${rawQuery}%`,
        `%${rawQuery}%`,
      ],
    );

    res.json({
      customers: rows,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const fullName = String(req.body.fullName ?? '').trim();
  const normalizedNit = normalizeNit(req.body.nit);
  const phone = String(req.body.phone ?? '').trim();
  const email = String(req.body.email ?? '').trim().toLowerCase();

  if (!fullName) {
    return res.status(400).json({
      message: 'Debes ingresar el nombre completo del cliente',
    });
  }

  if (!normalizedNit) {
    return res.status(400).json({
      message: 'Debes ingresar el NIT del cliente',
    });
  }

  const isConsumerFinalName = fullName.toLowerCase() === 'consumidor final';

  if (normalizedNit === 'CF' && !isConsumerFinalName) {
    return res.status(400).json({
      message: 'El NIT CF solo puede usarse para Consumidor Final.',
    });
  }

  try {
    const existingNitRows = await query(
      `
        ${customerSelect}
        WHERE UPPER(TRIM(COALESCE(nit, ''))) = ?
        LIMIT 1
      `,
      [normalizedNit],
    );

    if (existingNitRows.length) {
      return res.status(409).json({
        message: 'Este NIT ya está registrado. Selecciona el cliente existente.',
        customer: existingNitRows[0],
      });
    }

    const { firstName, lastName } = splitFullName(fullName);

    const result = await query(
      `
        INSERT INTO clientes (nombres, apellidos, nit, telefono, correo)
        VALUES (?, ?, ?, ?, ?)
      `,
      [firstName, lastName, normalizedNit, phone || null, email || null],
    );

    const createdRows = await query(
      `
        ${customerSelect}
        WHERE id_cliente = ?
        LIMIT 1
      `,
      [result.insertId],
    );

    res.status(201).json({
      message: 'Cliente creado correctamente',
      customer: createdRows[0],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
