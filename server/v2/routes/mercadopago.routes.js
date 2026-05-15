import { Router } from 'express';
import { createPreference, handleWebhook } from '../controllers/mercadopago.controller.js';

const router = Router();

router.post('/preference', createPreference);
router.post('/webhook', handleWebhook);

export default router;
