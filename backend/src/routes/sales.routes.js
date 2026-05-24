import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';
import { query, withTransaction } from '../db.js';

const router = Router();

router.use(authenticateToken);

const VALID_PAYMENT_METHODS = new Set(['efectivo', 'tarjeta', 'transferencia']);
const SALES_HISTORY_ADMIN_ROLES = new Set(['Administrador', 'Director']);
const GUATEMALA_TIME_ZONE = 'America/Guatemala';

const normalizeNit = (value) => String(value ?? '').trim().toUpperCase();
const normalizeText = (value) => String(value ?? '').trim();
const formatIsoDateParts = (value = new Date(), timeZone = GUATEMALA_TIME_ZONE) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);

  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';

  return `${year}-${month}-${day}`;
};

const formatLocalDate = (value = new Date()) => {
  return formatIsoDateParts(value);
};
const isValidDateInput = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const getOrCreateConsumerFinal = async (connection) => {
  const [existingRows] = await connection.execute(
    `
      SELECT id_cliente
      FROM clientes
      WHERE UPPER(TRIM(COALESCE(nit, ''))) = 'CF'
      LIMIT 1
    `,
  );

  if (existingRows.length) {
    return Number(existingRows[0].id_cliente);
  }

  const [insertResult] = await connection.execute(
    `
      INSERT INTO clientes (nombres, apellidos, nit, telefono, correo)
      VALUES ('Consumidor', 'Final', 'CF', '0000-0000', 'consumidor@local')
    `,
  );

  return Number(insertResult.insertId);
};

const resolveSalesHistoryAccess = async (userId) => {
  const rows = await query(
    `
      SELECT
        u.id_empleado,
        r.nombre AS roleName
      FROM usuarios u
      INNER JOIN roles r ON r.id_rol = u.id_rol
      WHERE u.id_usuario = ?
      LIMIT 1
    `,
    [userId],
  );

  if (!rows.length) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }

  const roleName = rows[0].roleName;
  const employeeId = rows[0].id_empleado ? Number(rows[0].id_empleado) : null;

  if (SALES_HISTORY_ADMIN_ROLES.has(roleName)) {
    return {
      employeeId: null,
      isRestricted: false,
      roleName,
    };
  }

  if (!employeeId) {
    const error = new Error('El usuario actual no tiene un empleado asociado para consultar ventas.');
    error.statusCode = 403;
    throw error;
  }

  return {
    employeeId,
    isRestricted: true,
    roleName,
  };
};

const buildSalesHistoryFilters = ({
  date,
  employeeId,
  isRestricted,
  paymentMethod,
  queryText,
}) => {
  const whereClauses = ['DATE(v.fecha) = ?'];
  const params = [date];

  if (paymentMethod) {
    whereClauses.push('v.metodo_pago = ?');
    params.push(paymentMethod);
  }

  if (isRestricted && employeeId) {
    whereClauses.push('v.id_empleado = ?');
    params.push(employeeId);
  }

  if (queryText) {
    whereClauses.push(
      `(
        CONCAT_WS(' ', COALESCE(c.nombres, ''), COALESCE(c.apellidos, '')) LIKE ?
        OR COALESCE(c.nit, '') LIKE ?
        OR EXISTS (
          SELECT 1
          FROM ventas_detalle vd2
          INNER JOIN productos p2 ON p2.id_producto = vd2.id_producto
          WHERE vd2.id_venta = v.id_venta
            AND p2.nombre LIKE ?
        )
      )`,
    );
    params.push(`%${queryText}%`, `%${queryText}%`, `%${queryText}%`);
  }

  return {
    params,
    whereSql: whereClauses.join(' AND '),
  };
};

router.get('/historial', async (req, res, next) => {
  const requestedDate = normalizeText(req.query.fecha) || formatLocalDate();
  const paymentMethodParam = normalizeText(req.query.metodo_pago).toLowerCase();
  const paymentMethod =
    !paymentMethodParam || paymentMethodParam === 'todos' ? '' : paymentMethodParam;
  const queryText = normalizeText(req.query.q);

  if (!isValidDateInput(requestedDate)) {
    return res.status(400).json({
      message: 'La fecha solicitada no tiene un formato válido.',
    });
  }

  if (paymentMethod && !VALID_PAYMENT_METHODS.has(paymentMethod)) {
    return res.status(400).json({
      message: 'El método de pago enviado no es válido.',
    });
  }

  try {
    const access = await resolveSalesHistoryAccess(req.user.sub);
    const filters = buildSalesHistoryFilters({
      date: requestedDate,
      employeeId: access.employeeId,
      isRestricted: access.isRestricted,
      paymentMethod,
      queryText,
    });

    const [summaryRows, detailRows, onlineSummaryRows, onlineDetailRows] = await Promise.all([
      query(
        `
          SELECT
            COALESCE(SUM(v.total), 0) AS total_vendido,
            COUNT(DISTINCT v.id_venta) AS cantidad_ventas,
            COALESCE(SUM(vd.cantidad), 0) AS productos_vendidos,
            COUNT(DISTINCT CASE WHEN v.metodo_pago = 'efectivo' THEN v.id_venta END) AS ventas_efectivo,
            COUNT(DISTINCT CASE WHEN v.metodo_pago = 'tarjeta' THEN v.id_venta END) AS ventas_tarjeta
          FROM ventas v
          LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
          LEFT JOIN ventas_detalle vd ON vd.id_venta = v.id_venta
          WHERE ${filters.whereSql}
        `,
        filters.params,
      ),
      query(
        `
          SELECT
            v.id_venta AS id,
            v.fecha,
            CONCAT_WS(' ', COALESCE(c.nombres, ''), COALESCE(c.apellidos, '')) AS cliente_nombre,
            COALESCE(NULLIF(TRIM(c.nit), ''), 'CF') AS nit,
            v.metodo_pago,
            v.subtotal,
            v.descuento,
            v.total,
            v.monto_recibido,
            v.cambio,
            v.referencia_pago,
            v.estado,
            COALESCE(u.nombre_usuario, CONCAT_WS(' ', COALESCE(e.nombres, ''), COALESCE(e.apellidos, '')), 'Sistema') AS cajero,
            p.id_producto AS producto_id,
            p.nombre AS producto_nombre,
            vd.cantidad,
            vd.precio_unitario,
            (vd.cantidad * vd.precio_unitario) AS subtotal_producto
          FROM ventas v
          LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
          LEFT JOIN empleados e ON e.id_empleado = v.id_empleado
          LEFT JOIN usuarios u ON u.id_empleado = v.id_empleado
          LEFT JOIN ventas_detalle vd ON vd.id_venta = v.id_venta
          LEFT JOIN productos p ON p.id_producto = vd.id_producto
          WHERE ${filters.whereSql}
          ORDER BY v.fecha DESC, v.id_venta DESC, vd.id_venta_detalle ASC
        `,
        filters.params,
      ),
      access.isRestricted
        ? Promise.resolve([
            {
              total_vendido: 0,
              cantidad_ventas: 0,
              productos_vendidos: 0,
              ventas_tarjeta: 0,
            },
          ])
        : query(
            `
              SELECT
                COALESCE(SUM(p.total), 0) AS total_vendido,
                COUNT(DISTINCT p.id_pedido) AS cantidad_ventas,
                COALESCE(SUM(pd.cantidad), 0) AS productos_vendidos,
                COUNT(DISTINCT p.id_pedido) AS ventas_tarjeta
              FROM pedidos p
              LEFT JOIN clientes c ON c.id_cliente = p.id_cliente
              LEFT JOIN pedidos_detalle pd ON pd.id_pedido = p.id_pedido
              WHERE DATE(p.fecha) = ?
                AND p.estado <> 'cancelado'
                ${
                  queryText
                    ? `AND (
                        CONCAT_WS(' ', COALESCE(c.nombres, ''), COALESCE(c.apellidos, '')) LIKE ?
                        OR COALESCE(c.nit, '') LIKE ?
                        OR EXISTS (
                          SELECT 1
                          FROM pedidos_detalle pd2
                          INNER JOIN productos p2 ON p2.id_producto = pd2.id_producto
                          WHERE pd2.id_pedido = p.id_pedido
                            AND p2.nombre LIKE ?
                        )
                      )`
                    : ''
                }
            `,
            queryText
              ? [requestedDate, `%${queryText}%`, `%${queryText}%`, `%${queryText}%`]
              : [requestedDate],
          ),
      access.isRestricted
        ? Promise.resolve([])
        : query(
            `
              SELECT
                p.id_pedido AS id,
                p.fecha,
                CONCAT_WS(' ', COALESCE(c.nombres, ''), COALESCE(c.apellidos, '')) AS cliente_nombre,
                COALESCE(NULLIF(TRIM(c.nit), ''), 'CF') AS nit,
                'tarjeta' AS metodo_pago,
                (p.total - COALESCE(p.costo_envio, 0)) AS subtotal,
                0 AS descuento,
                p.total,
                NULL AS monto_recibido,
                0 AS cambio,
                p.tracking_code AS referencia_pago,
                p.estado_pedido AS estado,
                'Tienda online' AS cajero,
                pr.id_producto AS producto_id,
                pr.nombre AS producto_nombre,
                pd.cantidad,
                pd.precio_unitario,
                pd.subtotal AS subtotal_producto
              FROM pedidos p
              LEFT JOIN clientes c ON c.id_cliente = p.id_cliente
              LEFT JOIN pedidos_detalle pd ON pd.id_pedido = p.id_pedido
              LEFT JOIN productos pr ON pr.id_producto = pd.id_producto
              WHERE DATE(p.fecha) = ?
                AND p.estado <> 'cancelado'
                ${
                  queryText
                    ? `AND (
                        CONCAT_WS(' ', COALESCE(c.nombres, ''), COALESCE(c.apellidos, '')) LIKE ?
                        OR COALESCE(c.nit, '') LIKE ?
                        OR EXISTS (
                          SELECT 1
                          FROM pedidos_detalle pd2
                          INNER JOIN productos p2 ON p2.id_producto = pd2.id_producto
                          WHERE pd2.id_pedido = p.id_pedido
                            AND p2.nombre LIKE ?
                        )
                      )`
                    : ''
                }
              ORDER BY p.fecha DESC, p.id_pedido DESC, pd.id_pedido_detalle ASC
            `,
            queryText
              ? [requestedDate, `%${queryText}%`, `%${queryText}%`, `%${queryText}%`]
              : [requestedDate],
          ),
    ]);

    const salesMap = new Map();

    for (const row of detailRows) {
      if (!salesMap.has(row.id)) {
        salesMap.set(row.id, {
          id: Number(row.id),
          fecha: row.fecha,
          origen: 'caja',
          origenLabel: 'Caja',
          cliente_nombre: row.cliente_nombre?.trim() || 'Consumidor Final',
          nit: normalizeNit(row.nit) || 'CF',
          metodo_pago: row.metodo_pago,
          subtotal: Number(row.subtotal ?? 0),
          descuento: Number(row.descuento ?? 0),
          total: Number(row.total ?? 0),
          monto_recibido: row.monto_recibido !== null ? Number(row.monto_recibido) : null,
          cambio: Number(row.cambio ?? 0),
          referencia_pago: row.referencia_pago ?? null,
          estado: row.estado,
          cajero: row.cajero?.trim() || 'Sistema',
          productos: [],
        });
      }

      if (row.producto_id) {
        salesMap.get(row.id).productos.push({
          producto_id: Number(row.producto_id),
          nombre: row.producto_nombre,
          cantidad: Number(row.cantidad ?? 0),
          precio_unitario: Number(row.precio_unitario ?? 0),
          subtotal: Number(row.subtotal_producto ?? 0),
        });
      }
    }

    for (const row of onlineDetailRows) {
      const saleKey = `online-${row.id}`;

      if (!salesMap.has(saleKey)) {
        salesMap.set(saleKey, {
          id: Number(row.id),
          fecha: row.fecha,
          origen: 'en_linea',
          origenLabel: 'En línea',
          cliente_nombre: row.cliente_nombre?.trim() || 'Consumidor Final',
          nit: normalizeNit(row.nit) || 'CF',
          metodo_pago: row.metodo_pago,
          subtotal: Number(row.subtotal ?? 0),
          descuento: Number(row.descuento ?? 0),
          total: Number(row.total ?? 0),
          monto_recibido: null,
          cambio: 0,
          referencia_pago: row.referencia_pago ?? null,
          estado: row.estado,
          cajero: 'Tienda online',
          productos: [],
        });
      }

      if (row.producto_id) {
        salesMap.get(saleKey).productos.push({
          producto_id: Number(row.producto_id),
          nombre: row.producto_nombre,
          cantidad: Number(row.cantidad ?? 0),
          precio_unitario: Number(row.precio_unitario ?? 0),
          subtotal: Number(row.subtotal_producto ?? 0),
        });
      }
    }

    const summary = summaryRows[0] ?? {
      total_vendido: 0,
      cantidad_ventas: 0,
      productos_vendidos: 0,
      ventas_efectivo: 0,
      ventas_tarjeta: 0,
    };
    const onlineSummary = onlineSummaryRows[0] ?? {
      total_vendido: 0,
      cantidad_ventas: 0,
      productos_vendidos: 0,
      ventas_tarjeta: 0,
    };

    res.json({
      fecha: requestedDate,
      filtros: {
        metodo_pago: paymentMethod || 'todos',
        q: queryText,
        rol: access.roleName,
      },
      resumen: {
        total_vendido: Number(summary.total_vendido ?? 0) + Number(onlineSummary.total_vendido ?? 0),
        cantidad_ventas: Number(summary.cantidad_ventas ?? 0) + Number(onlineSummary.cantidad_ventas ?? 0),
        productos_vendidos: Number(summary.productos_vendidos ?? 0) + Number(onlineSummary.productos_vendidos ?? 0),
        ventas_efectivo: Number(summary.ventas_efectivo ?? 0),
        ventas_tarjeta: Number(summary.ventas_tarjeta ?? 0) + Number(onlineSummary.ventas_tarjeta ?? 0),
      },
      ventas: Array.from(salesMap.values()).sort(
        (left, right) => new Date(right.fecha).getTime() - new Date(left.fecha).getTime(),
      ),
    });
  } catch (error) {
    next(error);
  }
});

const registerPresentialSale = async (req, res, next) => {
  const customerId = Number(req.body.customerId);
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const discount = Math.max(Number(req.body.discount ?? 0) || 0, 0);
  const paymentMethod = String(req.body.paymentMethod ?? 'efectivo').trim().toLowerCase();
  const amountReceived =
    req.body.amountReceived === null || req.body.amountReceived === undefined || req.body.amountReceived === ''
      ? null
      : Math.max(Number(req.body.amountReceived) || 0, 0);
  const paymentReference = String(req.body.paymentReference ?? '').trim();

  if (!items.length) {
    return res.status(400).json({
      message: 'Debes agregar al menos un producto a la venta.',
    });
  }

  if (!VALID_PAYMENT_METHODS.has(paymentMethod)) {
    return res.status(400).json({
      message: 'El método de pago seleccionado no es válido.',
    });
  }

  if (discount < 0) {
    return res.status(400).json({
      message: 'El descuento no puede ser negativo.',
    });
  }

  try {
    const sale = await withTransaction(async (connection) => {
      const [userRows] = await connection.execute(
        `
          SELECT
            u.id_empleado,
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

      if (userRows[0].roleName === 'Cliente') {
        const error = new Error('Las ventas presenciales solo pueden ser registradas por personal interno');
        error.statusCode = 403;
        throw error;
      }

      let employeeId = userRows[0].id_empleado ? Number(userRows[0].id_empleado) : null;

      if (!employeeId && userRows[0].correo) {
        const [matchedEmployeeRows] = await connection.execute(
          `
            SELECT id_empleado
            FROM empleados
            WHERE correo = ?
            LIMIT 1
          `,
          [userRows[0].correo],
        );

        if (matchedEmployeeRows.length && matchedEmployeeRows[0].id_empleado) {
          employeeId = Number(matchedEmployeeRows[0].id_empleado);

          await connection.execute(
            `
              UPDATE usuarios
              SET id_empleado = ?
              WHERE id_usuario = ?
            `,
            [employeeId, req.user.sub],
          );
        }
      }

      if (!employeeId) {
        const error = new Error(
          'El usuario actual no tiene un empleado asociado. Vincula un empleado a esta cuenta para registrar ventas.',
        );
        error.statusCode = 400;
        throw error;
      }

      const normalizedItems = items.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
      }));

      if (
        normalizedItems.some(
          (item) =>
            Number.isNaN(item.productId) ||
            Number.isNaN(item.quantity) ||
            item.quantity <= 0,
        )
      ) {
        const error = new Error('Los productos y cantidades de la venta son inválidos.');
        error.statusCode = 400;
        throw error;
      }

      const resolvedCustomerId =
        Number.isFinite(customerId) && customerId > 0
          ? customerId
          : await getOrCreateConsumerFinal(connection);

      const [customerRows] = await connection.execute(
        `
          SELECT id_cliente, nombres, apellidos, nit
          FROM clientes
          WHERE id_cliente = ?
          LIMIT 1
        `,
        [resolvedCustomerId],
      );

      if (!customerRows.length) {
        const error = new Error('Cliente no encontrado');
        error.statusCode = 404;
        throw error;
      }

      let subtotal = 0;

      const productSnapshots = [];

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
          const error = new Error('Uno de los productos no existe');
          error.statusCode = 404;
          throw error;
        }

        const product = productRows[0];

        if (Number(product.stock) < item.quantity) {
          const error = new Error(`Stock insuficiente para ${product.nombre}`);
          error.statusCode = 400;
          throw error;
        }

        const lineSubtotal = Number(product.precio_venta) * item.quantity;
        subtotal += lineSubtotal;

        productSnapshots.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(product.precio_venta),
          subtotal: lineSubtotal,
          name: product.nombre,
        });
      }

      if (discount > subtotal) {
        const error = new Error('El descuento no puede ser mayor al subtotal.');
        error.statusCode = 400;
        throw error;
      }

      const total = Math.max(subtotal - discount, 0);

      if (total < 0) {
        const error = new Error('El total calculado de la venta no es válido.');
        error.statusCode = 400;
        throw error;
      }

      if (paymentMethod === 'efectivo') {
        if (amountReceived === null) {
          const error = new Error('Debes indicar el monto recibido para pagos en efectivo.');
          error.statusCode = 400;
          throw error;
        }

        if (amountReceived < total) {
          const error = new Error('El monto recibido no cubre el total de la venta.');
          error.statusCode = 400;
          throw error;
        }
      }

      const change = paymentMethod === 'efectivo' && amountReceived !== null ? amountReceived - total : 0;

      const [saleResult] = await connection.execute(
        `
          INSERT INTO ventas (
            id_cliente,
            id_empleado,
            subtotal,
            descuento,
            total,
            metodo_pago,
            monto_recibido,
            cambio,
            referencia_pago,
            estado
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pagada')
        `,
        [
          resolvedCustomerId,
          employeeId,
          subtotal,
          discount,
          total,
          paymentMethod,
          paymentMethod === 'efectivo' ? amountReceived : null,
          paymentMethod === 'efectivo' ? change : 0,
          paymentMethod === 'efectivo' ? null : paymentReference || null,
        ],
      );

      const saleId = saleResult.insertId;

      for (const item of productSnapshots) {
        await connection.execute(
          `
            INSERT INTO ventas_detalle (
              id_venta,
              id_producto,
              cantidad,
              precio_unitario
            )
            VALUES (?, ?, ?, ?)
          `,
          [saleId, item.productId, item.quantity, item.unitPrice],
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
            VALUES (?, 'salida', ?, 'venta', ?)
          `,
          [item.productId, item.quantity, saleId],
        );
      }

      await connection.execute(
        `
          INSERT INTO pagos (
            id_venta,
            metodo_pago,
            monto,
            monto_recibido,
            cambio,
            referencia,
            estado
          )
          VALUES (?, ?, ?, ?, ?, ?, 'confirmado')
        `,
        [
          saleId,
          paymentMethod,
          total,
          paymentMethod === 'efectivo' ? amountReceived : null,
          paymentMethod === 'efectivo' ? change : 0,
          paymentMethod === 'efectivo' ? null : paymentReference || null,
        ],
      );

      return {
        id: saleId,
        subtotal,
        discount,
        total,
        paymentMethod,
        change,
        customer: {
          id: resolvedCustomerId,
          name: `${customerRows[0].nombres} ${customerRows[0].apellidos}`.trim(),
          nit: normalizeNit(customerRows[0].nit),
        },
      };
    });

    res.status(201).json({
      message: 'Venta registrada correctamente',
      sale,
    });
  } catch (error) {
    next(error);
  }
};

router.get('/summary', async (_req, res, next) => {
  try {
    const [
      productTotals,
      todaySalesRows,
      lowStockRows,
      lowStockCountRows,
      recentSales,
      salesByDayRows,
      productCreationRows,
      inventoryMovementRows,
    ] = await Promise.all([
      query(
        `
          SELECT
            COUNT(*) AS totalProducts,
            COALESCE(SUM(COALESCE(i.stock, 0)), 0) AS totalStock,
            COALESCE(SUM(COALESCE(i.stock, 0) * p.precio_venta), 0) AS inventoryValue
          FROM productos p
          LEFT JOIN inventario i ON i.id_producto = p.id_producto
        `,
      ),
      query(
        `
          SELECT
            COUNT(DISTINCT v.id_venta) AS totalSalesToday,
            COALESCE(SUM(vd.cantidad * vd.precio_unitario), 0) AS revenueToday,
            COALESCE(SUM(vd.cantidad), 0) AS itemsSoldToday
          FROM ventas v
          LEFT JOIN ventas_detalle vd ON vd.id_venta = v.id_venta
          WHERE DATE(v.fecha) = CURDATE()
        `,
      ),
      query(
        `
          SELECT
            p.id_producto AS id,
            p.nombre,
            COALESCE(i.stock, 0) AS stock
          FROM productos p
          LEFT JOIN inventario i ON i.id_producto = p.id_producto
          WHERE COALESCE(i.stock, 0) <= 5
          ORDER BY COALESCE(i.stock, 0), p.nombre
          LIMIT 5
        `,
      ),
      query(
        `
          SELECT COUNT(*) AS total
          FROM productos p
          LEFT JOIN inventario i ON i.id_producto = p.id_producto
          WHERE COALESCE(i.stock, 0) <= 5
        `,
      ),
      query(
        `
          SELECT
            v.id_venta AS id,
            v.fecha,
            COALESCE(CONCAT(c.nombres, ' ', c.apellidos), 'Consumidor final') AS customerName,
            COALESCE(SUM(vd.cantidad * vd.precio_unitario), 0) AS total
          FROM ventas v
          LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
          LEFT JOIN ventas_detalle vd ON vd.id_venta = v.id_venta
          GROUP BY v.id_venta, v.fecha, c.nombres, c.apellidos
          ORDER BY v.fecha DESC, v.id_venta DESC
          LIMIT 5
        `,
      ),
      query(
        `
          SELECT
            DATE(v.fecha) AS day,
            COUNT(DISTINCT v.id_venta) AS salesCount,
            COALESCE(SUM(vd.cantidad * vd.precio_unitario), 0) AS revenue
          FROM ventas v
          LEFT JOIN ventas_detalle vd ON vd.id_venta = v.id_venta
          WHERE DATE(v.fecha) BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE()
          GROUP BY DATE(v.fecha)
          ORDER BY DATE(v.fecha)
        `,
      ),
      query(
        `
          SELECT
            DATE(fecha_creacion) AS day,
            COUNT(*) AS total
          FROM productos
          WHERE DATE(fecha_creacion) BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE()
          GROUP BY DATE(fecha_creacion)
          ORDER BY DATE(fecha_creacion)
        `,
      ),
      query(
        `
          SELECT
            DATE(fecha) AS day,
            COALESCE(
              SUM(
                CASE
                  WHEN tipo = 'entrada' THEN cantidad
                  WHEN tipo = 'salida' THEN -cantidad
                  ELSE 0
                END
              ),
              0
            ) AS net
          FROM movimientos_inventario
          WHERE DATE(fecha) BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE()
          GROUP BY DATE(fecha)
          ORDER BY DATE(fecha)
        `,
      ),
    ]);

    const buildDailySeries = (rows, field) => {
      const rowMap = new Map(
        rows.map((row) => {
          const normalizedDay =
            typeof row.day === 'string' ? String(row.day).slice(0, 10) : formatIsoDateParts(new Date(row.day));

          return [normalizedDay, Number(row[field] ?? 0)];
        }),
      );

      const todayInGuatemala = formatLocalDate();
      const todayDate = new Date(`${todayInGuatemala}T12:00:00`);

      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(todayDate);
        date.setDate(todayDate.getDate() - (6 - index));
        const iso = formatLocalDate(date);

        return {
          date: iso,
          label: new Intl.DateTimeFormat('es-GT', {
            day: '2-digit',
            month: 'short',
            timeZone: GUATEMALA_TIME_ZONE,
          }).format(date),
          value: rowMap.get(iso) ?? 0,
        };
      });
    };

    res.json({
      overview: {
        totalProducts: Number(productTotals[0]?.totalProducts ?? 0),
        totalStock: Number(productTotals[0]?.totalStock ?? 0),
        inventoryValue: Number(productTotals[0]?.inventoryValue ?? 0),
        totalSalesToday: Number(todaySalesRows[0]?.totalSalesToday ?? 0),
        revenueToday: Number(todaySalesRows[0]?.revenueToday ?? 0),
        itemsSoldToday: Number(todaySalesRows[0]?.itemsSoldToday ?? 0),
      },
      lowStockProducts: lowStockRows.map((row) => ({
        ...row,
        stock: Number(row.stock),
      })),
      recentSales: recentSales.map((row) => ({
        ...row,
        total: Number(row.total),
      })),
      metrics: {
        notificationsCount: Number(lowStockCountRows[0]?.total ?? 0),
        revenueSeries: buildDailySeries(salesByDayRows, 'revenue'),
        salesSeries: buildDailySeries(salesByDayRows, 'salesCount'),
        inventorySeries: buildDailySeries(inventoryMovementRows, 'net'),
        productsSeries: buildDailySeries(productCreationRows, 'total'),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', registerPresentialSale);
router.post('/presenciales', registerPresentialSale);

export default router;
