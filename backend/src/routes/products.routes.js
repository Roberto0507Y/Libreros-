import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';
import { query, withTransaction } from '../db.js';
import { removeImage, uploadImageFromDataUrl } from '../services/storage.service.js';

const router = Router();

router.use(authenticateToken);

router.get('/', async (_req, res, next) => {
  try {
    const rows = await query(
      `
        SELECT
          p.id_producto AS id,
          p.nombre,
          p.descripcion,
          p.precio_compra AS purchasePrice,
          p.precio_venta AS salePrice,
          p.imagen AS primaryImage,
          p.imagen_secundaria AS secondaryImage,
          p.fecha_creacion AS createdAt,
          COALESCE(i.stock, 0) AS stock,
          m.id_marca AS brandId,
          COALESCE(m.nombre, 'Sin marca') AS brandName,
          s.id_subcategoria AS subcategoryId,
          s.nombre AS subcategoryName,
          c.id_categoria AS categoryId,
          c.nombre AS categoryName
        FROM productos p
        LEFT JOIN inventario i ON i.id_producto = p.id_producto
        LEFT JOIN marcas m ON m.id_marca = p.id_marca
        INNER JOIN subcategorias s ON s.id_subcategoria = p.id_subcategoria
        INNER JOIN categorias c ON c.id_categoria = s.id_categoria
        ORDER BY p.fecha_creacion DESC, p.id_producto DESC
      `,
    );

    res.json({
      products: rows,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const name = String(req.body.name ?? '').trim();
  const description = String(req.body.description ?? '').trim();
  const purchasePrice = Number(req.body.purchasePrice);
  const salePrice = Number(req.body.salePrice);
  const brandId = req.body.brandId ? Number(req.body.brandId) : null;
  const subcategoryId = Number(req.body.subcategoryId);
  const initialStock = Number(req.body.initialStock ?? 0);
  const primaryImage = typeof req.body.primaryImage === 'string' ? req.body.primaryImage.trim() : '';
  const secondaryImage =
    typeof req.body.secondaryImage === 'string' ? req.body.secondaryImage.trim() : '';

  if (!name || Number.isNaN(purchasePrice) || Number.isNaN(salePrice) || Number.isNaN(subcategoryId)) {
    return res.status(400).json({
      message: 'Debes completar nombre, precios y subcategoria',
    });
  }

  if (!primaryImage || !secondaryImage) {
    return res.status(400).json({
      message: 'Debes cargar las dos fotos del producto',
    });
  }

  if (purchasePrice < 0 || salePrice < 0 || initialStock < 0) {
    return res.status(400).json({
      message: 'Los valores numericos no pueden ser negativos',
    });
  }

  try {
    const [primaryImageUrl, secondaryImageUrl] = await Promise.all([
      uploadImageFromDataUrl(primaryImage, 'products', `${name}-principal`, 'La foto principal no es valida'),
      uploadImageFromDataUrl(
        secondaryImage,
        'products',
        `${name}-secundaria`,
        'La foto secundaria no es valida',
      ),
    ]);

    const productId = await withTransaction(async (connection) => {
      const [subcategoryRows] = await connection.execute(
        `
          SELECT id_subcategoria
          FROM subcategorias
          WHERE id_subcategoria = ?
          LIMIT 1
        `,
        [subcategoryId],
      );

      if (!subcategoryRows.length) {
        const error = new Error('Subcategoria no encontrada');
        error.statusCode = 404;
        throw error;
      }

      if (brandId) {
        const [brandRows] = await connection.execute(
          `
            SELECT id_marca
            FROM marcas
            WHERE id_marca = ?
            LIMIT 1
          `,
          [brandId],
        );

        if (!brandRows.length) {
          const error = new Error('Marca no encontrada');
          error.statusCode = 404;
          throw error;
        }
      }

      const [productResult] = await connection.execute(
        `
          INSERT INTO productos (
            nombre,
            descripcion,
            id_marca,
            id_subcategoria,
            precio_compra,
            precio_venta,
            imagen,
            imagen_secundaria
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          name,
          description || null,
          brandId,
          subcategoryId,
          purchasePrice,
          salePrice,
          primaryImageUrl,
          secondaryImageUrl,
        ],
      );

      const nextProductId = productResult.insertId;

      await connection.execute(
        `
          INSERT INTO inventario (id_producto, stock)
          VALUES (?, ?)
        `,
        [nextProductId, initialStock],
      );

      if (initialStock > 0) {
        await connection.execute(
          `
            INSERT INTO movimientos_inventario (
              id_producto,
              tipo,
              cantidad,
              referencia,
              id_referencia
            )
            VALUES (?, 'entrada', ?, 'producto_inicial', ?)
          `,
          [nextProductId, initialStock, nextProductId],
        );
      }

      return nextProductId;
    });

    const rows = await query(
      `
        SELECT
          p.id_producto AS id,
          p.nombre,
          p.descripcion,
          p.precio_compra AS purchasePrice,
          p.precio_venta AS salePrice,
          p.imagen AS primaryImage,
          p.imagen_secundaria AS secondaryImage,
          p.fecha_creacion AS createdAt,
          COALESCE(i.stock, 0) AS stock,
          m.id_marca AS brandId,
          COALESCE(m.nombre, 'Sin marca') AS brandName,
          s.id_subcategoria AS subcategoryId,
          s.nombre AS subcategoryName,
          c.id_categoria AS categoryId,
          c.nombre AS categoryName
        FROM productos p
        LEFT JOIN inventario i ON i.id_producto = p.id_producto
        LEFT JOIN marcas m ON m.id_marca = p.id_marca
        INNER JOIN subcategorias s ON s.id_subcategoria = p.id_subcategoria
        INNER JOIN categorias c ON c.id_categoria = s.id_categoria
        WHERE p.id_producto = ?
        LIMIT 1
      `,
      [productId],
    );

    res.status(201).json({
      message: 'Producto creado correctamente',
      product: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  const productId = Number(req.params.id);
  const name = String(req.body.name ?? '').trim();
  const description = String(req.body.description ?? '').trim();
  const purchasePrice = Number(req.body.purchasePrice);
  const salePrice = Number(req.body.salePrice);
  const brandId = req.body.brandId ? Number(req.body.brandId) : null;
  const subcategoryId = Number(req.body.subcategoryId);
  const stock = Number(req.body.initialStock ?? 0);
  const primaryImage = typeof req.body.primaryImage === 'string' ? req.body.primaryImage.trim() : '';
  const secondaryImage =
    typeof req.body.secondaryImage === 'string' ? req.body.secondaryImage.trim() : '';

  if (
    Number.isNaN(productId) ||
    !name ||
    Number.isNaN(purchasePrice) ||
    Number.isNaN(salePrice) ||
    Number.isNaN(subcategoryId)
  ) {
    return res.status(400).json({
      message: 'Debes completar nombre, precios y subcategoria',
    });
  }

  if (purchasePrice < 0 || salePrice < 0 || stock < 0) {
    return res.status(400).json({
      message: 'Los valores numericos no pueden ser negativos',
    });
  }

  try {
    const existingRows = await query(
      `
        SELECT
          p.id_producto AS id,
          p.imagen AS primaryImage,
          p.imagen_secundaria AS secondaryImage
        FROM productos p
        WHERE p.id_producto = ?
        LIMIT 1
      `,
      [productId],
    );

    if (!existingRows.length) {
      return res.status(404).json({
        message: 'Producto no encontrado',
      });
    }

    let nextPrimaryImage = existingRows[0].primaryImage;
    let nextSecondaryImage = existingRows[0].secondaryImage;

    if (primaryImage.startsWith('data:')) {
      nextPrimaryImage = await uploadImageFromDataUrl(
        primaryImage,
        'products',
        `${name}-principal`,
        'La foto principal no es valida',
      );
    }

    if (secondaryImage.startsWith('data:')) {
      nextSecondaryImage = await uploadImageFromDataUrl(
        secondaryImage,
        'products',
        `${name}-secundaria`,
        'La foto secundaria no es valida',
      );
    }

    await withTransaction(async (connection) => {
      const [subcategoryRows] = await connection.execute(
        `
          SELECT id_subcategoria
          FROM subcategorias
          WHERE id_subcategoria = ?
          LIMIT 1
        `,
        [subcategoryId],
      );

      if (!subcategoryRows.length) {
        const error = new Error('Subcategoria no encontrada');
        error.statusCode = 404;
        throw error;
      }

      if (brandId) {
        const [brandRows] = await connection.execute(
          `
            SELECT id_marca
            FROM marcas
            WHERE id_marca = ?
            LIMIT 1
          `,
          [brandId],
        );

        if (!brandRows.length) {
          const error = new Error('Marca no encontrada');
          error.statusCode = 404;
          throw error;
        }
      }

      await connection.execute(
        `
          UPDATE productos
          SET
            nombre = ?,
            descripcion = ?,
            id_marca = ?,
            id_subcategoria = ?,
            precio_compra = ?,
            precio_venta = ?,
            imagen = ?,
            imagen_secundaria = ?
          WHERE id_producto = ?
        `,
        [
          name,
          description || null,
          brandId,
          subcategoryId,
          purchasePrice,
          salePrice,
          nextPrimaryImage,
          nextSecondaryImage,
          productId,
        ],
      );

      await connection.execute(
        `
          UPDATE inventario
          SET stock = ?
          WHERE id_producto = ?
        `,
        [stock, productId],
      );
    });

    if (primaryImage.startsWith('data:') && existingRows[0].primaryImage !== nextPrimaryImage) {
      await removeImage(existingRows[0].primaryImage);
    }

    if (secondaryImage.startsWith('data:') && existingRows[0].secondaryImage !== nextSecondaryImage) {
      await removeImage(existingRows[0].secondaryImage);
    }

    const rows = await query(
      `
        SELECT
          p.id_producto AS id,
          p.nombre,
          p.descripcion,
          p.precio_compra AS purchasePrice,
          p.precio_venta AS salePrice,
          p.imagen AS primaryImage,
          p.imagen_secundaria AS secondaryImage,
          p.fecha_creacion AS createdAt,
          COALESCE(i.stock, 0) AS stock,
          m.id_marca AS brandId,
          COALESCE(m.nombre, 'Sin marca') AS brandName,
          s.id_subcategoria AS subcategoryId,
          s.nombre AS subcategoryName,
          c.id_categoria AS categoryId,
          c.nombre AS categoryName
        FROM productos p
        LEFT JOIN inventario i ON i.id_producto = p.id_producto
        LEFT JOIN marcas m ON m.id_marca = p.id_marca
        INNER JOIN subcategorias s ON s.id_subcategoria = p.id_subcategoria
        INNER JOIN categorias c ON c.id_categoria = s.id_categoria
        WHERE p.id_producto = ?
        LIMIT 1
      `,
      [productId],
    );

    res.json({
      message: 'Producto actualizado correctamente',
      product: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  const productId = Number(req.params.id);

  if (Number.isNaN(productId)) {
    return res.status(400).json({
      message: 'Debes enviar un producto valido',
    });
  }

  try {
    const rows = await query(
      `
        SELECT
          p.id_producto AS id,
          p.imagen AS primaryImage,
          p.imagen_secundaria AS secondaryImage
        FROM productos p
        WHERE p.id_producto = ?
        LIMIT 1
      `,
      [productId],
    );

    if (!rows.length) {
      return res.status(404).json({
        message: 'Producto no encontrado',
      });
    }

    await withTransaction(async (connection) => {
      await connection.execute(
        `
          DELETE FROM movimientos_inventario
          WHERE id_producto = ?
        `,
        [productId],
      );

      await connection.execute(
        `
          DELETE FROM inventario
          WHERE id_producto = ?
        `,
        [productId],
      );

      await connection.execute(
        `
          DELETE FROM productos
          WHERE id_producto = ?
        `,
        [productId],
      );
    });

    await Promise.all([removeImage(rows[0].primaryImage), removeImage(rows[0].secondaryImage)]);

    res.json({
      message: 'Producto eliminado correctamente',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
