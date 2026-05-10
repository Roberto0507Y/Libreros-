import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { Router } from 'express';
import jwt from 'jsonwebtoken';

import config from '../config.js';
import { query, withTransaction } from '../db.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { sendMail } from '../services/mail.service.js';

const router = Router();

const userSelect = `
  SELECT
    u.id_usuario,
    u.nombre_usuario,
    u.correo,
    u.password,
    u.activo,
    r.id_rol,
    r.nombre AS rol,
    e.id_empleado,
    e.nombres,
    e.apellidos,
    e.telefono,
    e.correo AS correo_empleado,
    p.puesto
  FROM usuarios u
  INNER JOIN roles r ON r.id_rol = u.id_rol
  LEFT JOIN empleados e ON e.id_empleado = u.id_empleado
  LEFT JOIN puestos p ON p.id_puesto = e.id_puesto
`;

const PASSWORD_RESET_SUBJECT = 'Restablece tu contraseña';

const toUserResponse = (user) => ({
  id: user.id_usuario,
  username: user.nombre_usuario,
  email: user.correo,
  role: {
    id: user.id_rol,
    name: user.rol,
  },
  active: Boolean(user.activo),
  employee: user.id_empleado
    ? {
        id: user.id_empleado,
        firstName: user.nombres,
        lastName: user.apellidos,
        phone: user.telefono,
        email: user.correo_empleado,
        position: user.puesto,
      }
    : null,
});

const buildPasswordResetTokenHash = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const buildPasswordResetUrl = (token) => {
  const baseUrl = config.app.frontendUrl.replace(/\/+$/, '');
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
};

const buildPasswordResetEmail = ({ resetUrl, displayName, expiresInMinutes }) => {
  const safeName = displayName || 'usuario';

  const text = [
    `Hola ${safeName},`,
    '',
    'Recibimos una solicitud para restablecer tu contraseña en Librería Digital.',
    'Haz clic en el siguiente enlace para continuar:',
    resetUrl,
    '',
    `Este enlace expirará en ${expiresInMinutes} minutos.`,
    'Si tú no solicitaste este cambio, puedes ignorar este correo.',
  ].join('\n');

  const html = `
    <div style="margin:0;padding:32px;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.10);">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a,#2563eb);color:#ffffff;">
          <div style="font-size:12px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;opacity:.7;">Seguridad de acceso</div>
          <h1 style="margin:14px 0 0;font-size:32px;line-height:1.1;">Restablece tu contraseña</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,.82);">
            Solicitud de recuperación para tu cuenta de Librería Digital.
          </p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 12px;font-size:16px;line-height:1.7;">Hola <strong>${safeName}</strong>,</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#475569;">
            Recibimos una solicitud para cambiar tu contraseña. Usa el siguiente botón para crear una nueva contraseña y recuperar el acceso a tu cuenta.
          </p>
          <div style="margin:28px 0;">
            <a href="${resetUrl}" style="display:inline-block;padding:14px 24px;border-radius:16px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;text-decoration:none;font-weight:700;box-shadow:0 16px 30px rgba(37,99,235,0.24);">
              Restablecer contraseña
            </a>
          </div>
          <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#475569;">
            Este enlace expirará en <strong>${expiresInMinutes} minutos</strong>.
          </p>
          <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#475569;">
            Si no solicitaste este cambio, puedes ignorar este correo con seguridad.
          </p>
          <div style="margin-top:24px;padding:16px 18px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
            <div style="font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#94a3b8;">Enlace directo</div>
            <div style="margin-top:8px;font-size:13px;line-height:1.7;color:#334155;word-break:break-all;">${resetUrl}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  return { html, text };
};

const findValidPasswordResetToken = async (token) => {
  const tokenHash = buildPasswordResetTokenHash(token);
  const rows = await query(
    `
      SELECT
        prt.id_token,
        prt.id_usuario,
        prt.expires_at,
        prt.used_at,
        u.nombre_usuario,
        u.correo
      FROM password_reset_tokens prt
      INNER JOIN usuarios u ON u.id_usuario = prt.id_usuario
      WHERE prt.token_hash = ?
      LIMIT 1
    `,
    [tokenHash],
  );

  const resetToken = rows[0];

  if (!resetToken) {
    return null;
  }

  if (resetToken.used_at) {
    return null;
  }

  if (new Date(resetToken.expires_at).getTime() < Date.now()) {
    return null;
  }

  return resetToken;
};

router.post('/request-access', async (req, res, next) => {
  const name = String(req.body.name ?? '').trim();
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const phone = String(req.body.phone ?? '').trim();
  const message = String(req.body.message ?? '').trim();

  if (!name || !email) {
    return res.status(400).json({
      message: 'Debes enviar tu nombre y tu correo',
    });
  }

  if (!email.includes('@') || email.length < 6) {
    return res.status(400).json({
      message: 'Debes enviar un correo valido',
    });
  }

  try {
    const existing = await query(
      `
        SELECT id_solicitud, estado
        FROM solicitudes_acceso
        WHERE correo = ?
        ORDER BY fecha_creacion DESC, id_solicitud DESC
        LIMIT 1
      `,
      [email],
    );

    if (existing[0]?.estado === 'pendiente') {
      return res.status(409).json({
        message: 'Ya existe una solicitud pendiente con ese correo',
      });
    }

    await query(
      `
        INSERT INTO solicitudes_acceso (nombres, correo, telefono, mensaje)
        VALUES (?, ?, ?, ?)
      `,
      [name, email, phone || null, message || null],
    );

    return res.status(201).json({
      message: 'Solicitud enviada. Un administrador debe aprobar tu acceso.',
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/register', async (req, res, next) => {
  const username = String(req.body.username ?? '').trim();
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const password = String(req.body.password ?? '');
  const fullName = String(req.body.fullName ?? '').trim();
  const phone = String(req.body.phone ?? '').trim();

  if (!username || !email || !password || !fullName) {
    return res.status(400).json({
      message: 'Debes completar usuario, nombre, correo y contrasena',
    });
  }

  if (!email.includes('@') || email.length < 6) {
    return res.status(400).json({
      message: 'Debes enviar un correo valido',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: 'La contrasena debe tener al menos 6 caracteres',
    });
  }

  try {
    const existingRows = await query(
      `
        SELECT id_usuario
        FROM usuarios
        WHERE nombre_usuario = ? OR correo = ?
        LIMIT 1
      `,
      [username, email],
    );

    if (existingRows.length) {
      return res.status(409).json({
        message: 'Ya existe un usuario registrado con ese nombre o correo',
      });
    }

    const [firstName, ...lastNameParts] = fullName.split(/\s+/);
    const lastName = lastNameParts.join(' ').trim() || 'Cliente';
    const passwordHash = await bcrypt.hash(password, 10);

    await withTransaction(async (connection) => {
      const [roleRows] = await connection.execute(
        `
          SELECT id_rol
          FROM roles
          WHERE nombre = 'Cliente'
          LIMIT 1
        `,
      );

      if (!roleRows.length) {
        const error = new Error('No existe el rol Cliente');
        error.statusCode = 500;
        throw error;
      }

      await connection.execute(
        `
          INSERT INTO clientes (nombres, apellidos, telefono, correo)
          VALUES (?, ?, ?, ?)
        `,
        [firstName, lastName, phone || null, email],
      );

      await connection.execute(
        `
          INSERT INTO usuarios (nombre_usuario, correo, password, id_rol, activo)
          VALUES (?, ?, ?, ?, TRUE)
        `,
        [username, email, passwordHash, roleRows[0].id_rol],
      );
    });

    return res.status(201).json({
      message: 'Cuenta creada correctamente. Ya puedes iniciar sesion.',
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  const email = String(req.body.email ?? '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return res.status(400).json({
      message: 'Debes ingresar un correo válido.',
    });
  }

  try {
    const rows = await query(
      `
        ${userSelect}
        WHERE u.correo = ?
        LIMIT 1
      `,
      [email],
    );

    const user = rows[0];

    if (!user || !user.activo) {
      return res.json({
        message:
          'Si encontramos una cuenta con ese correo, enviaremos un enlace para restablecer la contraseña.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = buildPasswordResetTokenHash(token);
    const expiresInMinutes = config.auth.passwordResetExpiresMinutes;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    const resetUrl = buildPasswordResetUrl(token);
    const { html, text } = buildPasswordResetEmail({
      resetUrl,
      displayName: user.nombre_usuario,
      expiresInMinutes,
    });

    await withTransaction(async (connection) => {
      await connection.execute(
        `
          UPDATE password_reset_tokens
          SET used_at = CURRENT_TIMESTAMP
          WHERE id_usuario = ? AND used_at IS NULL
        `,
        [user.id_usuario],
      );

      await connection.execute(
        `
          INSERT INTO password_reset_tokens (id_usuario, token_hash, expires_at)
          VALUES (?, ?, ?)
        `,
        [user.id_usuario, tokenHash, expiresAt],
      );
    });

    await sendMail({
      html,
      subject: PASSWORD_RESET_SUBJECT,
      text,
      to: user.correo,
    });

    return res.json({
      message:
        'Si encontramos una cuenta con ese correo, enviaremos un enlace para restablecer la contraseña.',
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/reset-password/validate', async (req, res, next) => {
  const token = String(req.query.token ?? '').trim();

  if (!token) {
    return res.status(400).json({
      message: 'El enlace de restablecimiento no es válido.',
    });
  }

  try {
    const resetToken = await findValidPasswordResetToken(token);

    if (!resetToken) {
      return res.status(400).json({
        message: 'El enlace ha expirado o ya no es válido. Solicita uno nuevo.',
      });
    }

    return res.json({
      message: 'Enlace válido. Ya puedes crear una nueva contraseña.',
      email: resetToken.correo,
      username: resetToken.nombre_usuario,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/reset-password', async (req, res, next) => {
  const token = String(req.body.token ?? '').trim();
  const password = String(req.body.password ?? '');

  if (!token) {
    return res.status(400).json({
      message: 'El enlace de restablecimiento no es válido.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: 'La contraseña debe tener al menos 6 caracteres.',
    });
  }

  try {
    const resetToken = await findValidPasswordResetToken(token);

    if (!resetToken) {
      return res.status(400).json({
        message: 'El enlace ha expirado o ya no es válido. Solicita uno nuevo.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await withTransaction(async (connection) => {
      await connection.execute(
        `
          UPDATE usuarios
          SET password = ?
          WHERE id_usuario = ?
        `,
        [passwordHash, resetToken.id_usuario],
      );

      await connection.execute(
        `
          UPDATE password_reset_tokens
          SET used_at = CURRENT_TIMESTAMP
          WHERE id_usuario = ? AND used_at IS NULL
        `,
        [resetToken.id_usuario],
      );
    });

    return res.json({
      message: 'Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión.',
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const identifier = String(req.body.identifier ?? '').trim();
  const password = String(req.body.password ?? '');

  if (!identifier || !password) {
    return res.status(400).json({
      message: 'Debes enviar tu usuario o correo y tu contrasena',
    });
  }

  try {
    const rows = await query(
      `
        ${userSelect}
        WHERE u.nombre_usuario = ? OR u.correo = ?
        LIMIT 1
      `,
      [identifier, identifier],
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        message: 'Credenciales invalidas',
      });
    }

    if (!user.activo) {
      return res.status(403).json({
        message: 'Tu usuario esta inactivo',
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Credenciales invalidas',
      });
    }

    const safeUser = toUserResponse(user);
    const token = jwt.sign(
      {
        sub: safeUser.id,
        username: safeUser.username,
        role: safeUser.role.name,
      },
      config.auth.jwtSecret,
      {
        expiresIn: config.auth.expiresIn,
      },
    );

    return res.json({
      message: 'Inicio de sesion correcto',
      token,
      user: safeUser,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const rows = await query(
      `
        ${userSelect}
        WHERE u.id_usuario = ?
        LIMIT 1
      `,
      [req.user.sub],
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
      });
    }

    return res.json({
      user: toUserResponse(user),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
