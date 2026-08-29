import { prisma } from '../prisma.js';
import { randomUUID } from 'node:crypto';
import { sanitizeString } from '../utils/sanitize.js';
import {
  getEffectivePrice,
  releaseOrderItemStock,
  reserveOrderItemStock,
} from './inventory.service.js';
import {
  PICKUP_ADDRESS,
  PICKUP_COMUNA_REGION,
} from '../config/store.js';

// parseJson removed as Prisma handles Json type natively

export const fetchAllOrders = async () => {
  const rows = await prisma.orders.findMany({
    orderBy: { order_number: 'desc' }
  });
  return rows;
};

export const fetchOrderByClient = async (clientOrderId) => {
  const row = await prisma.orders.findUnique({
    where: { client_order_id: clientOrderId }
  });
  if (!row) return null;

  return {
    id: row.client_order_id,
    order_number: row.order_number,
    customerName: String(row.customer_name || '').trim().split(/\s+/)[0] || 'Cliente',
    fulfillment: row.fulfillment,
    paymentMethod: row.payment_method,
    address: row.address,
    comuna_region: row.comuna_region,
    comunaRegion: row.comuna_region,
    notes: row.notes,
    items: row.items,
    total: row.total,
    status: row.status,
  };
};

export const insertSecureOrderService = async (orderData, paymentMethod) => {
  const id = orderData.id ?? randomUUID();
  const clientOrderId = String(orderData.clientOrderId ?? '').trim();
  
  return await prisma.$transaction(async (tx) => {
    if (clientOrderId) {
      const existing = await tx.orders.findUnique({
        where: { client_order_id: clientOrderId }
      });
      if (existing) {
        return { order: existing, duplicate: true };
      }
    }

    const secureItems = [];
    let secureTotal = 0;

    for (const item of (Array.isArray(orderData.items) ? orderData.items : [])) {
      await tx.$queryRaw`SELECT id FROM products WHERE id = ${item.id} FOR UPDATE`;
      const product = await tx.products.findUnique({
        where: { id: item.id },
        include: {
          product_images: { orderBy: { sort_order: 'asc' }, take: 1 },
          product_variants: true,
        }
      });
      if (!product) continue;
      
      const qty = Math.max(0, Number(item.qty) || 0);
      if (qty === 0) continue;

      const price = getEffectivePrice(product);
      const reservation = await reserveOrderItemStock(tx, product, item, qty);

      const itemSize = String(item.size || '').trim();
      secureItems.push({
        id: product.id,
        name: product.name,
        sku: reservation.sku,
        label: product.label,
        variant: String(item.variant || '').trim(),
        size: reservation.size || itemSize,
        image: product.product_images?.[0]?.url ?? '',
        qty,
        price,
      });

      secureTotal += price * qty;
    }

    if (secureItems.length === 0) {
      throw new Error("La orden no contiene productos válidos.");
    }

    const fulfillment = sanitizeString(orderData.fulfillment ?? 'pickup');
    const submittedAddress = sanitizeString(orderData.address ?? '');
    const address = fulfillment === 'pickup' ? '' : submittedAddress;
    const comunaRegion = fulfillment === 'pickup'
      ? (sanitizeString(orderData.comunaRegion) || PICKUP_COMUNA_REGION)
      : fulfillment === 'delivery'
        ? 'Antofagasta, Antofagasta'
        : sanitizeString(orderData.comunaRegion);

    if (fulfillment === 'delivery' && !submittedAddress) {
      throw new Error("Ingresa una dirección para el delivery en Antofagasta.");
    }

    const newOrder = await tx.orders.create({
      data: {
        id,
        customer_name: sanitizeString(orderData.customerName),
        customer_phone: sanitizeString(orderData.customerPhone),
        customer_email: sanitizeString(orderData.customerEmail),
        rut: sanitizeString(orderData.rut),
        comuna_region: comunaRegion,
        client_order_id: clientOrderId,
        fulfillment,
        payment_method: paymentMethod,
        address,
        notes: sanitizeString(orderData.notes),
        items: secureItems,
        total: secureTotal,
        status: 'pending',
        mp_preference_id: sanitizeString(orderData.mpPreferenceId),
        mp_payment_id: sanitizeString(orderData.mpPaymentId)
      }
    });

    return { order: newOrder, duplicate: false };
  });
};

export const cancelOrderAndReleaseStockService = async (orderId) => {
  if (!orderId) return null;

  return await prisma.$transaction(async (tx) => {
    const order = await tx.orders.findUnique({ where: { id: orderId } });
    if (!order || order.status !== 'pending') return order;

    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      await releaseOrderItemStock(tx, item);
    }

    return await tx.orders.update({
      where: { id: orderId },
      data: { status: 'cancelled', updated_at: new Date() },
    });
  });
};

export const fetchStaleMercadoPagoPendingOrders = async (olderThanDate, limit = 25) => {
  return await prisma.orders.findMany({
    where: {
      status: 'pending',
      payment_method: 'mercadopago',
      mp_payment_id: '',
      mp_preference_id: { not: '' },
      created_at: { lt: olderThanDate },
    },
    orderBy: { created_at: 'asc' },
    take: limit,
  });
};

export const updateOrderStatusService = async (id, status) => {
  const validStatuses = ['pending', 'confirmed', 'shipped', 'ready_for_pickup', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error("Estado inválido.");
  }

  const updated = await prisma.orders.update({
    where: { id },
    data: { status }
  });
  
  return updated;
};

export const deleteOrderService = async (id) => {
  const result = await prisma.orders.delete({ where: { id } });
  return !!result;
};
