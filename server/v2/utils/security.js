/* global Buffer, process */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;

export const SESSION_COOKIE_NAME = 'gs_sid';
export const CSRF_COOKIE_NAME = 'gs_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const sessionTtlMinutes = Number(process.env.ADMIN_SESSION_TTL_MINUTES);
const sessionTtlHours = Number(process.env.ADMIN_SESSION_TTL_HOURS || 8);

export const SESSION_TTL_MS = Math.max(
  5 * ONE_MINUTE_MS,
  Number.isFinite(sessionTtlMinutes) && sessionTtlMinutes > 0
    ? sessionTtlMinutes * ONE_MINUTE_MS
    : sessionTtlHours * ONE_HOUR_MS
);

export const isProduction = process.env.NODE_ENV === 'production';

export const createOpaqueToken = (bytes = 32) => randomBytes(bytes).toString('base64url');

export const hashToken = (token) =>
  createHash('sha256').update(String(token || ''), 'utf8').digest('hex');

export const safeEqual = (left, right) => {
  const leftValue = Buffer.from(String(left || ''));
  const rightValue = Buffer.from(String(right || ''));
  if (leftValue.length !== rightValue.length) return false;
  return timingSafeEqual(leftValue, rightValue);
};

export const getSessionCookieOptions = (maxAge = SESSION_TTL_MS) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/',
  maxAge,
});

export const getCsrfCookieOptions = (maxAge = SESSION_TTL_MS) => ({
  httpOnly: false,
  secure: isProduction,
  sameSite: 'strict',
  path: '/',
  maxAge,
});

export const clearAuthCookies = (res) => {
  res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions(0));
  res.clearCookie(CSRF_COOKIE_NAME, getCsrfCookieOptions(0));
};

export const securityLog = (event, req, details = {}) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.get?.('user-agent') || 'unknown';
  console.warn('[security]', JSON.stringify({
    event,
    ip,
    userAgent,
    path: req.originalUrl,
    method: req.method,
    ...details,
  }));
};

export const parseAllowedOrigins = () => {
  const configured = [
    process.env.BASE_URL,
    process.env.STORE_URL,
    process.env.CORS_ORIGINS,
    isProduction ? null : 'http://localhost:3000',
    isProduction ? null : 'http://127.0.0.1:3000',
    isProduction ? null : 'http://localhost:5173',
    isProduction ? null : 'http://127.0.0.1:5173',
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return [...new Set(configured)];
};
