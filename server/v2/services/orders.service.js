import { getDb } from '../db.js';
import { randomUUID } from 'node:crypto';
import { sanitizeString } from '../utils/sanitize.js';

const parseJson = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

export const fetchAllOrders = async () => {
  const db = await getDb();
  const rows = await db.all("SELECT * FROM orders ORDER BY order_number DESC");
  return rows.map((r) => ({
    ...r,
    items: parseJson(r.items, []),
  }));
};

export const fetchOrderByClient = async (clientOrderId) => {
  const db = await getDb();
  const row = await db.get("SELECT * FROM orders WHERE id = ? OR client_order_id = ?", [clientOrderId, clientOrderId]);
  if (!row) return null;
  return { ...row, items: parseJson(row.items, []) };
};

export const insertSecureOrderService = async (orderData, paymentMethod) => {
  const db = await getDb();
  const id = orderData.id ?? randomUUID();
  const clientOrderId = String(orderData.clientOrderId ?? '').trim();
  
  // Usar transacción para asegurar consistencia de stock y orden
  await db.run("BEGIN TRANSACTION");

  try {
    if (clientOrderId) {
      const existing = await db.get(
        "SELECT * FROM orders WHERE client_order_id = ?",
        [clientOrderId]
      );
      if (existing) {
        await db.run("ROLLBACK");
        return { order: existing, duplicate: true };
      }
    }

    // VALIDACIÓN SEGURA: Recalcular precios desde DB
    const dbProducts = await db.all("SELECT * FROM products");
    
    const secureItems = [];
    let secureTotal = 0;

    for (const item of (Array.isArray(orderData.items) ? orderData.items : [])) {
      const product = dbProducts.find(p => p.id === item.id);
      if (!product) continue;
      
      const qty = Math.max(0, Number(item.qty) || 0);
      if (qty === 0) continue;

      // DETERMINAR PRECIO (Considerar Oferta Semanal)
      let price = product.price;
      const now = new Date();
      if (product.is_weekly_offer === 1 && product.offer_price !== null) {
        let active = true;
        if (product.offer_start_date) {
          const start = new Date(product.offer_start_date);
          if (now < start) active = false;
        }
        if (product.offer_end_date) {
          const end = new Date(product.offer_end_date);
          if (now > end) active = false;
        }
        if (active) {
          price = product.offer_price;
        }
      }

      // VALIDACIÓN DE STOCK para WhatsApp (MP se valida en el webhook)
      if (paymentMethod === 'whatsapp' || paymentMethod === 'transfer') {
        if (product.stock < qty) {
          throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);
        }
        // Descontar stock
        await db.run("UPDATE products SET stock = stock - ? WHERE id = ?", [qty, product.id]);
      }

      // Obtener imagen (primera disponible)
      const imageRow = await db.get("SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order LIMIT 1", [product.id]);

      secureItems.push({
        id: product.id,
        name: product.name,
        sku: product.sku,
        label: product.label,
        variant: String(item.variant || '').trim(),
        image: imageRow?.url ?? "",
        qty: qty,
        price: price 
      });
      
      secureTotal += price * qty;
    }

    if (secureItems.length === 0) {
      throw new Error("La orden no contiene productos válidos.");
    }

    const fulfillment = sanitizeString(orderData.fulfillment ?? 'pickup');
    const address = sanitizeString(orderData.address ?? '');

    await db.run(`
      INSERT INTO orders (
        id, customer_name, customer_phone, customer_email, rut, comuna_region, client_order_id,
        fulfillment, payment_method, address, notes, items, total, status,
        mp_preference_id, mp_payment_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      sanitizeString(orderData.customerName),
      sanitizeString(orderData.customerPhone),
      sanitizeString(orderData.customerEmail),
      sanitizeString(orderData.rut),
      sanitizeString(orderData.comunaRegion),
      clientOrderId,
      fulfillment,
      paymentMethod,
      address,
      sanitizeString(orderData.notes),
      JSON.stringify(secureItems),
      secureTotal,
      'pending',
      sanitizeString(orderData.mpPreferenceId),
      sanitizeString(orderData.mpPaymentId)
    ]);

    await db.run("COMMIT");
    const newOrder = await db.get("SELECT * FROM orders WHERE id = ?", [id]);
    return { order: newOrder, duplicate: false };

  } catch (error) {
    await db.run("ROLLBACK");
    throw error;
  }
};

export const updateOrderStatusService = async (id, status) => {
  const db = await getDb();
  const validStatuses = ['pending', 'confirmed', 'shipped', 'ready_for_pickup', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error("Estado inválido.");
  }

  const result = await db.run("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, id]);
  
  if (result.changes === 0) {
    return null; // Not found
  }

  const updated = await db.get("SELECT * FROM orders WHERE id = ?", [id]);
  return { ...updated, items: parseJson(updated.items, []) };
};

export const deleteOrderService = async (id) => {
  const db = await getDb();
  const result = await db.run("DELETE FROM orders WHERE id = ?", [id]);
  return result.changes > 0;
};
