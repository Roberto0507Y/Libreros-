import { Router } from 'express';

import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
const ADMIN_ROLES = new Set(['Administrador', 'Director']);

const requireAdmin = (req, res, next) => {
  if (!ADMIN_ROLES.has(req.user?.role)) {
    return res.status(403).json({
      message: 'Solo un administrador puede gestionar usuarios',
    });
  }

  return next();
};

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', async (_req, res, next) => {
  try {
    const [users, roles] = await Promise.all([
      query(
        `
          SELECT
            u.id_usuario AS id,
            u.nombre_usuario AS username,
            u.correo AS email,
            u.activo AS active,
            u.fecha_creacion AS createdAt,
            r.id_rol AS roleId,
            r.nombre AS roleName,
            e.id_empleado AS employeeId,
            e.nombres AS employeeFirstName,
            e.apellidos AS employeeLastName,
            c.id_cliente AS customerId,
            c.nombres AS customerFirstName,
            c.apellidos AS customerLastName
          FROM usuarios u
          INNER JOIN roles r ON r.id_rol = u.id_rol
          LEFT JOIN empleados e ON e.id_empleado = u.id_empleado
          LEFT JOIN clientes c ON c.correo = u.correo
          ORDER BY u.fecha_creacion DESC, u.id_usuario DESC
        `,
      ),
      query(
        `
          SELECT id_rol AS id, nombre
          FROM roles
          ORDER BY nombre
        `,
      ),
    ]);

    res.json({
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        active: Boolean(user.active),
        createdAt: user.createdAt,
        role: {
          id: user.roleId,
          name: user.roleName,
        },
        profileName:
          [user.employeeFirstName, user.employeeLastName].filter(Boolean).join(' ').trim() ||
          [user.customerFirstName, user.customerLastName].filter(Boolean).join(' ').trim() ||
          user.username,
        profileType: user.employeeId ? 'empleado' : user.customerId ? 'cliente' : 'usuario',
      })),
      roles,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/role', async (req, res, next) => {
  const userId = Number(req.params.id);
  const roleId = Number(req.body.roleId);

  if (Number.isNaN(userId) || Number.isNaN(roleId)) {
    return res.status(400).json({
      message: 'Debes enviar un usuario y un rol validos',
    });
  }

  try {
    const [userRows, roleRows] = await Promise.all([
      query(
        `
          SELECT id_usuario
          FROM usuarios
          WHERE id_usuario = ?
          LIMIT 1
        `,
        [userId],
      ),
      query(
        `
          SELECT id_rol, nombre
          FROM roles
          WHERE id_rol = ?
          LIMIT 1
        `,
        [roleId],
      ),
    ]);

    if (!userRows.length) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
      });
    }

    if (!roleRows.length) {
      return res.status(404).json({
        message: 'Rol no encontrado',
      });
    }

    await query(
      `
        UPDATE usuarios
        SET id_rol = ?
        WHERE id_usuario = ?
      `,
      [roleId, userId],
    );

    res.json({
      message: `Rol actualizado a ${roleRows[0].nombre}`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
