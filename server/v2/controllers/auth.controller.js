import { prisma } from '../prisma.js';
import bcrypt from 'bcryptjs';
import {
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  clearAuthCookies,
  createOpaqueToken,
  getCsrfCookieOptions,
  getSessionCookieOptions,
  hashToken,
  securityLog,
} from '../utils/security.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUMMY_HASH = '$2b$12$9vBK5nwV8bC4qUZY6uGqlO4zDj2rdB4vptqjJr8kzPS6yE3SFrO3e';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizePassword = (value) => String(value || '');

const isValidLoginPayload = ({ email, password }) => (
  EMAIL_REGEX.test(email) &&
  password.length >= 8 &&
  password.length <= 128
);

export const adminLogin = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = normalizePassword(req.body?.password);

  if (!isValidLoginPayload({ email, password })) {
    securityLog('admin_login_invalid_payload', req, { email });
    return res.status(400).json({ error: "Faltan credenciales" });
  }

  try {
    const admin = await prisma.admins.findUnique({
      where: { email }
    });

    const passwordHash = admin?.password_hash || DUMMY_HASH;
    const isValid = await bcrypt.compare(password, passwordHash);
    
    if (!admin || !isValid) {
      securityLog('admin_login_failed', req, { email });
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    if (req.session?.id) {
      await prisma.sessions.deleteMany({ where: { id: req.session.id } });
    }

    const sessionToken = createOpaqueToken();
    const csrfToken = createOpaqueToken(24);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

    await prisma.sessions.create({
      data: {
        id: hashToken(sessionToken),
        is_admin: 1,
        cart: [],
        checkout_prefs: {},
        expires_at: expiresAt
      }
    });

    res.cookie(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());
    res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());
    securityLog('admin_login_success', req, { email });

    res.json({ success: true, isAdmin: true });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const adminLogout = async (req, res) => {
  try {
    if (req.session?.id) {
      await prisma.sessions.deleteMany({ where: { id: req.session.id } });
    }
    
    clearAuthCookies(res);
    securityLog('admin_logout', req);
    res.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Error al cerrar sesión" });
  }
};
