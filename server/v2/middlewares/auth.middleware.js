import { prisma } from '../prisma.js';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  clearAuthCookies,
  getCsrfCookieOptions,
  getSessionCookieOptions,
  hashToken,
  safeEqual,
  securityLog,
} from '../utils/security.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (sessionToken) {
      const sessionId = hashToken(sessionToken);
      const session = await prisma.sessions.findUnique({ where: { id: sessionId } });
      if (session) {
        const now = new Date();
        const expiry = session.expires_at ? new Date(session.expires_at) : null;
        
        if (expiry && now > expiry) {
          await prisma.sessions.deleteMany({ where: { id: sessionId } });
          clearAuthCookies(res);
          securityLog('session_expired', req);
        } else {
          req.session = session;
          req.isAdmin = session.is_admin === 1;
        }
      } else {
        clearAuthCookies(res);
      }
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    next();
  }
};

export const requireAdmin = async (req, res, next) => {
  if (!req.isAdmin) {
    securityLog('admin_access_denied', req);
    return res.status(401).json({ error: "Acceso denegado. Se requieren permisos de administrador." });
  }

  try {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await prisma.sessions.update({
      where: { id: req.session.id },
      data: { expires_at: expiresAt, updated_at: new Date() }
    });

    res.cookie(SESSION_COOKIE_NAME, req.cookies[SESSION_COOKIE_NAME], getSessionCookieOptions());
    if (req.cookies?.[CSRF_COOKIE_NAME]) {
      res.cookie(CSRF_COOKIE_NAME, req.cookies[CSRF_COOKIE_NAME], getCsrfCookieOptions());
    }
    req.session.expires_at = expiresAt;
  } catch (error) {
    console.error("Session refresh error:", error);
    return res.status(500).json({ error: "Error al renovar sesión" });
  }

  next();
};

export const requireCsrf = (req, res, next) => {
  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const csrfHeader = req.get(CSRF_HEADER_NAME);

  if (!csrfCookie || !csrfHeader || !safeEqual(csrfCookie, csrfHeader)) {
    securityLog('csrf_validation_failed', req);
    return res.status(403).json({ error: "Solicitud rechazada por validación CSRF." });
  }

  next();
};
