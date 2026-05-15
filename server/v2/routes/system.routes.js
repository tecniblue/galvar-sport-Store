import { Router } from 'express';
import { getBootstrap, updateState, updateCart, updateCheckoutPrefs } from '../controllers/system.controller.js';
import { authMiddleware, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Públicas pero con lectura de sesión
router.get('/bootstrap', authMiddleware, getBootstrap);
router.put('/cart', authMiddleware, updateCart);
router.put('/checkout-prefs', authMiddleware, updateCheckoutPrefs);

// Protegidas por Admin
router.put('/state/:key', authMiddleware, requireAdmin, updateState);

export default router;
