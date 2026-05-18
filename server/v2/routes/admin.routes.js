import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { adminLogin, adminLogout } from '../controllers/auth.controller.js';
import { authMiddleware, requireAdmin, requireCsrf } from '../middlewares/auth.middleware.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Demasiados intentos de inicio de sesión. Por favor, intente más tarde." }
});

const router = Router();

router.post('/login', loginLimiter, adminLogin);
router.post('/logout', authMiddleware, requireAdmin, requireCsrf, adminLogout);

// Endpoint útil para que el frontend verifique si sigue logueado
router.get('/session', authMiddleware, (req, res) => {
  res.json({
    isAuthenticated: !!req.session,
    isAdmin: !!req.isAdmin
  });
});

export default router;
