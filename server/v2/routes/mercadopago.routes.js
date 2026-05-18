import { Router } from 'express';
import { createPreference, handleWebhook, processPayment } from '../controllers/mercadopago.controller.js';

const router = Router();

router.post('/preference', createPreference);
router.post('/process_payment', processPayment);
router.post('/webhook', handleWebhook);

export default router;
