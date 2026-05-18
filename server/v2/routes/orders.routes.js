import { Router } from 'express';
import { getOrders, createOrder, updateOrderStatus, deleteOrder, getOrderByClient } from '../controllers/orders.controller.js';
import { authMiddleware, requireAdmin, requireCsrf } from '../middlewares/auth.middleware.js';

import rateLimit from 'express-rate-limit';

const router = Router();

// Límite estricto para creación de órdenes: 5 por cada 15 minutos por IP
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de pedido. Por favor, intenta de nuevo en unos minutos." }
});

router.get('/client/:clientOrderId', getOrderByClient); // PUBLIC route
router.get('/', authMiddleware, requireAdmin, getOrders);
router.post('/', orderLimiter, createOrder);
router.put('/:id/status', authMiddleware, requireAdmin, requireCsrf, updateOrderStatus);
router.delete('/:id', authMiddleware, requireAdmin, requireCsrf, deleteOrder);

export default router;
