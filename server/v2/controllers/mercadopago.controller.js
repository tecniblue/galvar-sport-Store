/* global process */

import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import { prisma } from '../prisma.js';
import { createMercadoPagoService } from '../../services/mercadopago.service.js';
import {
  cancelOrderAndReleaseStockService,
  fetchStaleMercadoPagoPendingOrders,
  insertSecureOrderService,
} from '../services/orders.service.js';
import { applyPaymentToOrder } from '../services/payment.service.js';

// parseJson removed as Prisma handles Json type natively

const verifySignature = (headers, query, secret) => {
  const xSignature = headers['x-signature'];
  const xRequestId = headers['x-request-id'];
  const paymentId = query['data.id'] || query.id;
  
  if (!xSignature || !secret || !paymentId) return false;

  const parts = xSignature.split(',');
  const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
  const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1];

  if (!ts || !v1) return false;

  // Formato: id:[data.id];request-id:[x-request-id];ts:[ts];
  const manifest = `id:${paymentId};request-id:${xRequestId || ''};ts:${ts};`;
  const sha = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  const expected = Buffer.from(sha, 'hex');
  const received = Buffer.from(v1, 'hex');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

const mpService = createMercadoPagoService(process.env.MP_ACCESS_TOKEN);

export const createPreference = async (req, res) => {
  if (!mpService) {
    return res.status(500).json({ error: "Mercado Pago no está configurado." });
  }

  let createdOrder = null;
  let wasDuplicate = false;

  try {
    const { order, duplicate } = await insertSecureOrderService(req.body, 'mercadopago');
    createdOrder = order;
    wasDuplicate = duplicate;
    
    const fullOrder = { 
      ...order, 
      id: order.id,
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      items: order.items 
    };
    
    let baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    const preference = await mpService.createPreference(fullOrder, baseUrl);
    
    await prisma.orders.update({
      where: { id: fullOrder.id },
      data: { mp_preference_id: preference.id }
    });
    
    res.json({ 
      id: preference.id, 
      init_point: preference.init_point,
      order: {
        id: fullOrder.id,
        order_number: fullOrder.order_number,
      }
    });
  } catch (error) {
    console.error("Error generating MP preference", error);
    if (createdOrder?.id && !wasDuplicate && !createdOrder.mp_preference_id) {
      await cancelOrderAndReleaseStockService(createdOrder.id).catch((releaseError) => {
        console.error("Error releasing stock after MP preference failure", releaseError);
      });
    }
    res.status(400).json({ error: error.message || "Error al procesar el pago con Mercado Pago" });
  }
};

export const processPayment = async (req, res) => {
  if (!mpService) {
    return res.status(500).json({ error: "Mercado Pago no está configurado." });
  }

  try {
    const orderId = req.body.external_reference;
    
    if (!orderId) {
      return res.status(400).json({ error: "Falta external_reference en el pago" });
    }

    const orderToPay = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!orderToPay) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }
    if (orderToPay.status !== 'pending') {
      return res.status(409).json({ error: "La orden no está pendiente de pago" });
    }
    if (!orderToPay.mp_preference_id) {
      return res.status(400).json({ error: "La orden no tiene preferencia de Mercado Pago asociada" });
    }

    req.body.transaction_amount = Number(orderToPay.total);

    const payment = await mpService.processPayment(req.body);
    
    await applyPaymentToOrder(payment);

    res.json(payment);
  } catch (error) {
    console.error("Error processing payment brick:", error);
    const details = error.cause || error.message;
    res.status(400).json({ 
      error: "Error al procesar el pago con Mercado Pago",
      details: details,
      raw_message: error.message
    });
  }
};

export const handleWebhook = async (req, res) => {
  const topic = req.query.topic || req.query.type;
  const paymentId = req.query['data.id'] || req.query.id;
  
  const body = req.body || {};
  const eventType = body.type || topic || (body.action?.startsWith('payment') ? 'payment' : null);
  const evtPaymentId = body.data?.id || paymentId;

  console.log("=== WEBHOOK V2 RECIBIDO ===", { topic, paymentId, eventType, evtPaymentId });

  const mpSecret = process.env.MP_WEBHOOK_SECRET;
  if (mpSecret) {
    const isValid = verifySignature(req.headers, req.query, mpSecret);
    if (!isValid) {
      console.warn("⚠️ Firma de Webhook INVÁLIDA.");
      return res.status(401).send("Invalid signature");
    } else {
      console.log("✅ Firma de Webhook verificada correctamente.");
    }
  }

  if (eventType === 'payment' && evtPaymentId && mpService) {
    try {
      console.log("Consultando pago a Mercado Pago:", evtPaymentId);
      const payment = await mpService.getPayment(evtPaymentId);
      console.log("Estado del pago:", payment.status, "External ref:", payment.external_reference);

      try {
        await applyPaymentToOrder(payment);
      } catch (err) {
        console.error("Error en webhook transaction:", err);
        if (err.message === "Pago parcial no permitido") {
          return res.status(400).send("Pago parcial no permitido");
        }
        throw err;
      }
    } catch (error) {
      console.error("Webhook processing error", error);
    }
  } else if ((eventType === 'merchant_order' || eventType === 'topic_merchant_order_wh' || topic === 'merchant_order') && evtPaymentId && mpService) {
    try {
      console.log("Consultando merchant order a Mercado Pago:", evtPaymentId);
      const merchantOrder = await mpService.getMerchantOrder(evtPaymentId);
      console.log("Estado merchant order:", merchantOrder.status, "External ref:", merchantOrder.external_reference);

      const payments = Array.isArray(merchantOrder.payments) ? merchantOrder.payments : [];
      for (const merchantPayment of payments) {
        const paymentIdFromOrder = merchantPayment.id || merchantPayment.payment_id;
        if (!paymentIdFromOrder) continue;

        const payment = await mpService.getPayment(paymentIdFromOrder);
        payment.external_reference = payment.external_reference || merchantOrder.external_reference;
        console.log("Pago en merchant order:", payment.id, payment.status, "External ref:", payment.external_reference);

        try {
          await applyPaymentToOrder(payment);
        } catch (err) {
          console.error("Error procesando merchant order payment:", err);
          if (err.message === "Pago parcial no permitido") {
            return res.status(400).send("Pago parcial no permitido");
          }
          throw err;
        }
      }
    } catch (error) {
      console.error("Merchant order webhook processing error", error);
    }
  }
  
  res.status(200).send("OK");
};

export const cleanupStaleMercadoPagoOrders = async ({
  olderThanMinutes = 60,
  limit = 25,
} = {}) => {
  if (!mpService) return { checked: 0, confirmed: 0, cancelled: 0, lookupFailed: 0 };

  const olderThanDate = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const staleOrders = await fetchStaleMercadoPagoPendingOrders(olderThanDate, limit);
  const result = { checked: staleOrders.length, confirmed: 0, cancelled: 0, lookupFailed: 0 };

  for (const order of staleOrders) {
    try {
      let confirmed = false;
      let lookupSucceeded = false;

      if (order.mp_preference_id) {
        const merchantOrders = await mpService.searchMerchantOrders({
          externalReference: order.id,
          preferenceId: order.mp_preference_id,
          limit: 5,
        });
        lookupSucceeded = true;

        for (const merchantOrder of merchantOrders) {
          const payments = Array.isArray(merchantOrder?.payments) ? merchantOrder.payments : [];
          for (const merchantPayment of payments) {
            const paymentIdFromOrder = merchantPayment.id || merchantPayment.payment_id;
            if (!paymentIdFromOrder) continue;

            const payment = await mpService.getPayment(paymentIdFromOrder);
            payment.external_reference = payment.external_reference || merchantOrder.external_reference || order.id;

            if (payment.status === 'approved') {
              await applyPaymentToOrder(payment);
              result.confirmed++;
              confirmed = true;
              break;
            }
          }
          if (confirmed) break;
        }
      }

      if (!lookupSucceeded) {
        result.lookupFailed++;
        console.warn("No se pudo verificar la orden pendiente en Mercado Pago; no se cancela:", order.id);
        continue;
      }

      if (!confirmed) {
        await cancelOrderAndReleaseStockService(order.id);
        result.cancelled++;
        console.log("Orden Mercado Pago expirada y stock liberado:", order.id);
      }
    } catch (error) {
      console.error("Error limpiando orden Mercado Pago pendiente:", order.id, error);
    }
  }

  return result;
};
