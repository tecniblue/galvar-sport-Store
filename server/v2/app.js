import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { getDb } from './db.js';

export const createApp = async () => {
  const app = express();

  // Confiar en el proxy de Ngrok/Nginx para que el rate limit funcione correctamente
  app.set('trust proxy', 1);

  // Seguridad: Helmet oculta headers y previene varios ataques comunes
  app.use(helmet({
    contentSecurityPolicy: false, // Desactivado temporalmente para no romper React/Vite si hay assets externos
  }));

  // Seguridad: Rate Limiting global
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Límite generoso para assets estáticos
    message: "Demasiadas peticiones desde esta IP."
  });
  app.use(globalLimiter);

  // Seguridad: Rate Limiting específico para la API
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300, // 300 peticiones a la API por 15 minutos
    message: { error: "Límite de peticiones a la API excedido." }
  });
  app.use('/api/', apiLimiter);

  // Middlewares
  app.use(cors({
    origin: process.env.BASE_URL || "http://localhost:5173",
    credentials: true
  }));
  app.use(express.json({ limit: '1mb' })); // Límite reducido a 1MB para prevenir DoS por payload
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

  app.use('/api/admin', adminRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/mercadopago', mpRouter);
  app.use('/api', systemRouter);

  // Servir archivos estáticos de frontend (carpeta dist)
  const __dirname = path.resolve();
  const distPath = path.join(__dirname, 'dist');
  
  app.use(express.static(distPath));
  
  // Servir imágenes subidas
  const uploadsPath = path.join(__dirname, 'data', 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  
  // Soporte para React Router (cualquier otra ruta GET devuelve index.html)
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  return app;
};
