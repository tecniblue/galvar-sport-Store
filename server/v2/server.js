/* global process */

import 'dotenv/config';
import { createApp } from './app.js';
import { prisma } from './prisma.js';
import { ensureInitialAdmin } from './services/admin.service.js';
import { cleanupStaleMercadoPagoOrders } from './controllers/mercadopago.controller.js';

const PORT = Number(process.env.PORT) || 3001;
const pendingCleanupEnabled = process.env.MP_PENDING_CLEANUP_ENABLED !== 'false';
const pendingCleanupMinutes = Math.max(30, Number(process.env.MP_PENDING_EXPIRY_MINUTES) || 60);
const pendingCleanupIntervalMinutes = Math.max(5, Number(process.env.MP_PENDING_CLEANUP_INTERVAL_MINUTES) || 10);

const startMercadoPagoPendingCleanup = () => {
  if (!pendingCleanupEnabled) return;

  const runCleanup = async () => {
    try {
      const result = await cleanupStaleMercadoPagoOrders({
        olderThanMinutes: pendingCleanupMinutes,
      });
      if (result.checked > 0) {
        console.log('Limpieza Mercado Pago pending:', result);
      }
    } catch (error) {
      console.error('Error en limpieza Mercado Pago pending:', error);
    }
  };

  const timer = setInterval(runCleanup, pendingCleanupIntervalMinutes * 60 * 1000);
  timer.unref?.();

  const firstRun = setTimeout(runCleanup, 30 * 1000);
  firstRun.unref?.();
};

async function startServer() {
  try {
    // 1. Conectar Prisma. El schema se gestiona con Prisma migrations.
    console.log('Conectando base de datos...');
    await prisma.$connect();
    await ensureInitialAdmin();
    console.log('✅ Base de datos conectada');

    // 2. Crear app de Express
    const app = await createApp();

    // 3. Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor V2 (Express) corriendo en http://localhost:${PORT}`);
      startMercadoPagoPendingCleanup();
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
