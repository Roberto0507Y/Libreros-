import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';
import { query } from '../db.js';
import { removeImage, uploadImageFromDataUrl } from '../services/storage.service.js';

const router = Router();

router.get('/storefront', async (_req, res, next) => {
  try {
    const [brands, categories, products] = await Promise.all([
      query(
        `
          SELECT id_marca AS id, nombre, imagen
          FROM marcas
          ORDER BY nombre
        `,
      ),
      query(
        `
          SELECT id_categoria AS id, nombre, imagen
          FROM categorias
          ORDER BY nombre
        `,
      ),
      query(
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
      ),
    ]);

    res.json({
      brands,
      categories,
      products,
    });
  } catch (error) {
    next(error);
  }
});

router.use(authenticateToken);

router.get('/options', async (_req, res, next) => {
  try {
    const [brands, categories, subcategories] = await Promise.all([
      query(
        `
          SELECT id_marca AS id, nombre, imagen
          FROM marcas
          ORDER BY nombre
        `,
      ),
      query(
        `
          SELECT id_categoria AS id, nombre, imagen
          FROM categorias
          ORDER BY nombre
        `,
      ),
      query(
        `
          SELECT
            s.id_subcategoria AS id,
            s.nombre,
            s.id_categoria AS categoryId
          FROM subcategorias s
          ORDER BY s.nombre
        `,
      ),
    ]);

    res.json({
      brands,
      categories,
      subcategories,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/categories', async (req, res, next) => {
  const name = String(req.body.name ?? '').trim();
  const imageData = typeof req.body.image === 'string' ? req.body.image.trim() : '';

  if (!name) {
    return res.status(400).json({
      message: 'Debes escribir el nombre de la categoria',
    });
  }

  if (!imageData) {
    return res.status(400).json({
      message: 'Debes cargar la imagen de la categoria',
    });
  }

  try {
    const existingRows = await query(
      `
        SELECT id_categoria AS id
        FROM categorias
        WHERE LOWER(nombre) = LOWER(?)
        LIMIT 1
      `,
      [name],
    );

    if (existingRows.length) {
      return res.status(409).json({
        message: 'La categoria ya existe',
      });
    }

    const imagePath = await uploadImageFromDataUrl(
      imageData,
      'categories',
      name,
      'La imagen de la categoria no es valida',
    );

    const result = await query(
      `
        INSERT INTO categorias (nombre, imagen)
        VALUES (?, ?)
      `,
      [name, imagePath],
    );

    const categoryRows = await query(
      `
        SELECT id_categoria AS id, nombre, imagen
        FROM categorias
        WHERE id_categoria = ?
        LIMIT 1
      `,
      [result.insertId],
    );

    res.status(201).json({
      message: 'Categoria creada correctamente',
      category: categoryRows[0],
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/categories/:id', async (req, res, next) => {
  const categoryId = Number(req.params.id);
  const name = String(req.body.name ?? '').trim();
  const imageData = typeof req.body.image === 'string' ? req.body.image.trim() : '';

  if (Number.isNaN(categoryId) || !name) {
    return res.status(400).json({
      message: 'Debes enviar una categoria valida y su nombre',
    });
  }

  try {
    const categoryRows = await query(
      `
        SELECT id_categoria AS id, nombre, imagen
        FROM categorias
        WHERE id_categoria = ?
        LIMIT 1
      `,
      [categoryId],
    );

    if (!categoryRows.length) {
      return res.status(404).json({
        message: 'Categoria no encontrada',
      });
    }

    const duplicateRows = await query(
      `
        SELECT id_categoria AS id
        FROM categorias
        WHERE LOWER(nombre) = LOWER(?)
          AND id_categoria <> ?
        LIMIT 1
      `,
      [name, categoryId],
    );

    if (duplicateRows.length) {
      return res.status(409).json({
        message: 'Ya existe otra categoria con ese nombre',
      });
    }

    let imagePath = categoryRows[0].imagen;

    if (imageData) {
      imagePath = await uploadImageFromDataUrl(
        imageData,
        'categories',
        name,
        'La imagen de la categoria no es valida',
      );
    }

    await query(
      `
        UPDATE categorias
        SET nombre = ?, imagen = ?
        WHERE id_categoria = ?
      `,
      [name, imagePath, categoryId],
    );

    if (imageData && categoryRows[0].imagen && categoryRows[0].imagen !== imagePath) {
      await removeImage(categoryRows[0].imagen);
    }

    const updatedRows = await query(
      `
        SELECT id_categoria AS id, nombre, imagen
        FROM categorias
        WHERE id_categoria = ?
        LIMIT 1
      `,
      [categoryId],
    );

    res.json({
      message: 'Categoria actualizada correctamente',
      category: updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/categories/:id', async (req, res, next) => {
  const categoryId = Number(req.params.id);

  if (Number.isNaN(categoryId)) {
    return res.status(400).json({
      message: 'Debes enviar una categoria valida',
    });
  }

  try {
    const [categoryRows, subcategoriesRows] = await Promise.all([
      query(
        `
          SELECT id_categoria AS id, nombre, imagen
          FROM categorias
          WHERE id_categoria = ?
          LIMIT 1
        `,
        [categoryId],
      ),
      query(
        `
          SELECT COUNT(*) AS total
          FROM subcategorias
          WHERE id_categoria = ?
        `,
        [categoryId],
      ),
    ]);

    if (!categoryRows.length) {
      return res.status(404).json({
        message: 'Categoria no encontrada',
      });
    }

    if (Number(subcategoriesRows[0]?.total ?? 0) > 0) {
      return res.status(409).json({
        message: 'No puedes eliminar una categoria que ya tiene subcategorias asociadas',
      });
    }

    await query(
      `
        DELETE FROM categorias
        WHERE id_categoria = ?
      `,
      [categoryId],
    );

    await removeImage(categoryRows[0].imagen);

    res.json({
      message: 'Categoria eliminada correctamente',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/brands', async (req, res, next) => {
  const name = String(req.body.name ?? '').trim();
  const imageData = typeof req.body.image === 'string' ? req.body.image.trim() : '';

  if (!name) {
    return res.status(400).json({
      message: 'Debes escribir el nombre de la marca',
    });
  }

  if (!imageData) {
    return res.status(400).json({
      message: 'Debes cargar la imagen de la marca',
    });
  }

  try {
    const existingRows = await query(
      `
        SELECT id_marca AS id, nombre, imagen
        FROM marcas
        WHERE LOWER(nombre) = LOWER(?)
        LIMIT 1
      `,
      [name],
    );

    if (existingRows.length) {
      return res.status(409).json({
        message: 'La marca ya existe',
      });
    }

    const imagePath = await uploadImageFromDataUrl(
      imageData,
      'brands',
      name,
      'La imagen de la marca no es valida',
    );

    const result = await query(
      `
        INSERT INTO marcas (nombre, imagen)
        VALUES (?, ?)
      `,
      [name, imagePath],
    );

    const brandRows = await query(
      `
        SELECT id_marca AS id, nombre, imagen
        FROM marcas
        WHERE id_marca = ?
        LIMIT 1
      `,
      [result.insertId],
    );

    res.status(201).json({
      message: 'Marca creada correctamente',
      brand: brandRows[0],
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/brands/:id', async (req, res, next) => {
  const brandId = Number(req.params.id);
  const name = String(req.body.name ?? '').trim();
  const imageData = typeof req.body.image === 'string' ? req.body.image.trim() : '';

  if (Number.isNaN(brandId) || !name) {
    return res.status(400).json({
      message: 'Debes enviar una marca valida y su nombre',
    });
  }

  try {
    const brandRows = await query(
      `
        SELECT id_marca AS id, nombre, imagen
        FROM marcas
        WHERE id_marca = ?
        LIMIT 1
      `,
      [brandId],
    );

    if (!brandRows.length) {
      return res.status(404).json({
        message: 'Marca no encontrada',
      });
    }

    const duplicateRows = await query(
      `
        SELECT id_marca AS id
        FROM marcas
        WHERE LOWER(nombre) = LOWER(?)
          AND id_marca <> ?
        LIMIT 1
      `,
      [name, brandId],
    );

    if (duplicateRows.length) {
      return res.status(409).json({
        message: 'Ya existe otra marca con ese nombre',
      });
    }

    let imagePath = brandRows[0].imagen;

    if (imageData) {
      imagePath = await uploadImageFromDataUrl(
        imageData,
        'brands',
        name,
        'La imagen de la marca no es valida',
      );
    }

    await query(
      `
        UPDATE marcas
        SET nombre = ?, imagen = ?
        WHERE id_marca = ?
      `,
      [name, imagePath, brandId],
    );

    if (imageData && brandRows[0].imagen && brandRows[0].imagen !== imagePath) {
      await removeImage(brandRows[0].imagen);
    }

    const updatedRows = await query(
      `
        SELECT id_marca AS id, nombre, imagen
        FROM marcas
        WHERE id_marca = ?
        LIMIT 1
      `,
      [brandId],
    );

    res.json({
      message: 'Marca actualizada correctamente',
      brand: updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/brands/:id', async (req, res, next) => {
  const brandId = Number(req.params.id);

  if (Number.isNaN(brandId)) {
    return res.status(400).json({
      message: 'Debes enviar una marca valida',
    });
  }

  try {
    const [brandRows, productsRows] = await Promise.all([
      query(
        `
          SELECT id_marca AS id, nombre, imagen
          FROM marcas
          WHERE id_marca = ?
          LIMIT 1
        `,
        [brandId],
      ),
      query(
        `
          SELECT COUNT(*) AS total
          FROM productos
          WHERE id_marca = ?
        `,
        [brandId],
      ),
    ]);

    if (!brandRows.length) {
      return res.status(404).json({
        message: 'Marca no encontrada',
      });
    }

    if (Number(productsRows[0]?.total ?? 0) > 0) {
      return res.status(409).json({
        message: 'No puedes eliminar una marca que ya tiene productos asociados',
      });
    }

    await query(
      `
        DELETE FROM marcas
        WHERE id_marca = ?
      `,
      [brandId],
    );

    await removeImage(brandRows[0].imagen);

    res.json({
      message: 'Marca eliminada correctamente',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/subcategories', async (req, res, next) => {
  const name = String(req.body.name ?? '').trim();
  const categoryId = Number(req.body.categoryId);

  if (!name || Number.isNaN(categoryId)) {
    return res.status(400).json({
      message: 'Debes escribir el nombre y seleccionar una categoria',
    });
  }

  try {
    const categoryRows = await query(
      `
        SELECT id_categoria AS id, nombre
        FROM categorias
        WHERE id_categoria = ?
        LIMIT 1
      `,
      [categoryId],
    );

    if (!categoryRows.length) {
      return res.status(404).json({
        message: 'La categoria seleccionada no existe',
      });
    }

    const existingRows = await query(
      `
        SELECT id_subcategoria AS id
        FROM subcategorias
        WHERE LOWER(nombre) = LOWER(?)
          AND id_categoria = ?
        LIMIT 1
      `,
      [name, categoryId],
    );

    if (existingRows.length) {
      return res.status(409).json({
        message: 'La subcategoria ya existe en esa categoria',
      });
    }

    const result = await query(
      `
        INSERT INTO subcategorias (nombre, id_categoria)
        VALUES (?, ?)
      `,
      [name, categoryId],
    );

    const subcategoryRows = await query(
      `
        SELECT
          s.id_subcategoria AS id,
          s.nombre,
          s.id_categoria AS categoryId
        FROM subcategorias s
        WHERE s.id_subcategoria = ?
        LIMIT 1
      `,
      [result.insertId],
    );

    res.status(201).json({
      message: 'Subcategoria creada correctamente',
      subcategory: subcategoryRows[0],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
