import crypto from 'node:crypto';
import { getDb } from '../db.js';
import { createMercadoPagoService } from '../../services/mercadopago.service.js';
import { insertSecureOrderService } from '../services/orders.service.js';
import { sendOrderEmails } from '../../services/email/email.service.js';

const parseJson = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

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

  return sha === v1;
};

const mpService = createMercadoPagoService(process.env.MP_ACCESS_TOKEN);

export const createPreference = async (req, res) => {
  if (!mpService) {
    return res.status(500).json({ error: "Mercado Pago no está configurado." });
  }

  try {
    const db = await getDb();
    const { order, duplicate } = await insertSecureOrderService(req.body, 'mercadopago');
    const fullOrder = { ...order, items: parseJson(order.items, []) };
    
    // Generar preferencia en MP
    let baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    const preference = await mpService.createPreference(fullOrder, baseUrl);
    
    // Actualizar la orden local con el ID de preferencia
    await db.run("UPDATE orders SET mp_preference_id = ? WHERE id = ?", [preference.id, fullOrder.id]);
    
    res.json({ id: preference.id, init_point: preference.init_point });
  } catch (error) {
    console.error("Error generating MP preference", error);
    res.status(400).json({ error: error.message || "Error al procesar el pago con Mercado Pago" });
  }
};

export const handleWebhook = async (req, res) => {
  const topic = req.query.topic || req.query.type;
  const paymentId = req.query['data.id'] || req.query.id;
  
  const body = req.body || {};
  const eventType = body.type || topic || (body.action?.startsWith('payment') ? 'payment' : null);
  const evtPaymentId = body.data?.id || paymentId;

  console.log("=== WEBHOOK V2 RECIBIDO ===", { topic, paymentId, eventType, evtPaymentId });

  // Verificación de firma de Mercado Pago
  const mpSecret = process.env.MP_WEBHOOK_SECRET;
  if (mpSecret) {
    const isValid = verifySignature(req.headers, req.query, mpSecret);
    if (!isValid) {
      console.error("⚠️ Firma de Webhook INVÁLIDA. Posible intento de fraude.");
      return res.status(401).send("Invalid signature");
    }
    console.log("✅ Firma de Webhook verificada correctamente.");
  }

  if (eventType === 'payment' && evtPaymentId && mpService) {
    try {
      const db = await getDb();
      console.log("Consultando pago a Mercado Pago:", evtPaymentId);
      const payment = await mpService.getPayment(evtPaymentId);
      console.log("Estado del pago:", payment.status, "External ref:", payment.external_reference);
      
      if (payment.status === 'approved') {
        const orderId = payment.external_reference;
        if (orderId) {
          // PROTECCIÓN: Actualización de stock y estado en transacción atómica
          await db.run("BEGIN TRANSACTION");
          
          try {
            const order = await db.get("SELECT * FROM orders WHERE id = ?", [orderId]);
            
            if (order && order.status === 'pending') {
              const fullOrder = { ...order, items: parseJson(order.items, []) };
              let stockError = false;
              
              for (const item of fullOrder.items) {
                const qty = Number(item.qty) || 0;
                const result = await db.run(`
                  UPDATE products 
                  SET stock = stock - ? 
                  WHERE id = ? AND stock >= ?
                `, [qty, item.id, qty]);
                
                if (result.changes === 0) {
                  stockError = true;
                  break;
                }
              }

              const newStatus = stockError ? 'paid_out_of_stock' : 'confirmed';
              
              // El WHERE status = 'pending' asegura que si otro proceso ya la actualizó, no hagamos nada
              const updateResult = await db.run(
                "UPDATE orders SET status = ?, mp_payment_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'", 
                [newStatus, String(evtPaymentId), orderId]
              );

              if (updateResult.changes > 0) {
                if (stockError) {
                  // Hacemos ROLLBACK del stock (pero ya actualizamos la orden arriba? No, el ROLLBACK deshace todo)
                  // Entonces, si hay error de stock, hacemos ROLLBACK y luego actualizamos la orden fuera
                  await db.run("ROLLBACK");
                  await db.run("UPDATE orders SET status = ?, mp_payment_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [newStatus, String(evtPaymentId), orderId]);
                  console.log("Orden pagada pero sin stock suficiente:", orderId);
                } else {
                  await db.run("COMMIT");
                  console.log("Orden confirmada exitosamente:", orderId);
                }
                
                fullOrder.status = newStatus;
                await sendOrderEmails(fullOrder);
                console.log("Correos enviados para orden:", orderId);
              } else {
                await db.run("ROLLBACK");
                console.log("Orden ya procesada por otra instancia.");
              }
            } else {
              await db.run("ROLLBACK");
              console.log("Orden no encontrada o ya procesada. Estado actual:", order?.status);
            }
          } catch (err) {
            try { await db.run("ROLLBACK"); } catch(e) {}
            throw err;
          }
        }
      }
    } catch (error) {
      console.error("Webhook processing error", error);
    }
  } else {
    console.log("Evento ignorado o incompleto.");
  }
  
  res.status(200).send("OK");
};
