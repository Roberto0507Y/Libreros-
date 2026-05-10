import jwt from 'jsonwebtoken';

import config from '../config.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization ?? '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      message: 'Debes iniciar sesion para continuar',
    });
  }

  try {
    req.user = jwt.verify(token, config.auth.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({
      message: 'Tu sesion ya no es valida',
    });
  }
};
