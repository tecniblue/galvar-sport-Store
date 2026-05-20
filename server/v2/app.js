/* global process */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { isProduction, parseAllowedOrigins, securityLog } from './utils/security.js';

export const createApp = async () => {
  const app = express();

  // Confiar en el proxy de Ngrok/Nginx para que el rate limit funcione correctamente
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Seguridad: Helmet oculta headers y previene varios ataques comunes
  // Nota: crossOriginEmbedderPolicy debe estar desactivado y referrerPolicy en
  // strict-origin-when-cross-origin para que el SDK de Mercado Pago pueda cargar
  // sus assets SVG desde http2.mlstatic.com sin recibir 403 Forbidden.
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "https://sdk.mercadopago.com"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "blob:", "https://*.mlstatic.com", "https://http2.mlstatic.com"],
        "connect-src": [
          "'self'",
          "https://api.mercadopago.com",
          "https://*.mercadopago.com",
          "https://*.mercadopago.cl",
          "https://*.mercadolibre.com",
        ],
        "frame-src": [
          "'self'",
          "https://*.mercadopago.com",
          "https://*.mercadopago.cl",
          "https://*.mercadolibre.com",
          "https://maps.google.com",
          "https://www.google.com",
        ],
        "media-src": ["'self'", "https://*.mlstatic.com"],
      },
    },
    crossOriginEmbedderPolicy: false, // COEP 'require-corp' bloquea recursos MP sin encabezados CORP
    crossOriginResourcePolicy: { policy: 'same-site' },
    frameguard: { action: 'deny' },
    hsts: isProduction ? { maxAge: 15552000, includeSubDomains: true, preload: false } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }, // Permite que mlstatic.com valide el referrer
  }));

  // Seguridad: Rate Limiting global
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Límite generoso para assets estáticos
    standardHeaders: true,
    legacyHeaders: false,
    message: "Demasiadas peticiones desde esta IP."
  });
  app.use(globalLimiter);

  // Seguridad: Rate Limiting específico para la API
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300, // 300 peticiones a la API por 15 minutos
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Límite de peticiones a la API excedido." }
  });
  app.use('/api/', apiLimiter);

  const allowedOrigins = parseAllowedOrigins();

  // Middlewares
  app.use(cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);
      return callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    maxAge: 600,
  }));
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '15mb' }));
  app.use(cookieParser());

  // Rutas básicas de prueba para confirmar que Express funciona
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor Express V2 funcionando' });
  });

  // Importar routers
  const { default: adminRouter } = await import('./routes/admin.routes.js');
  const { default: ordersRouter } = await import('./routes/orders.routes.js');
  const { default: mpRouter } = await import('./routes/mercadopago.routes.js');
  const { default: systemRouter } = await import('./routes/system.routes.js');
  const { default: catalogRouter } = await import('./routes/catalog.routes.js');

  app.use('/api/admin', adminRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/mercadopago', mpRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api', systemRouter);

  // Servir archivos estáticos de frontend (carpeta dist)
  const __dirname = path.resolve();
  const distPath = path.join(__dirname, 'dist');
  
  app.use(express.static(distPath));
  
  // Servir imágenes subidas
  const uploadsPath = path.join(__dirname, 'data', 'uploads');
  app.use('/uploads', express.static(uploadsPath, {
    dotfiles: 'deny',
    setHeaders(res, filePath) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (filePath.toLowerCase().endsWith('.svg')) {
        res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
        res.setHeader('Content-Disposition', 'attachment');
      }
    },
  }));
  
  // Soporte para React Router (cualquier otra ruta GET devuelve index.html)
  app.use((err, req, res, next) => {
    if (err?.message === 'Origen no permitido por CORS') {
      securityLog('cors_blocked', req, { origin: req.get('origin') });
      return res.status(403).json({ error: 'Origen no permitido.' });
    }
    next(err);
  });

  app.use((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });

  return app;
};
