import { prisma } from '../prisma.js';
import { sendOrderEmails } from '../../services/email/email.service.js';
import { cancelOrderAndReleaseStockService } from './orders.service.js';

const REJECTED_PAYMENT_STATUSES = new Set(['rejected', 'cancelled', 'cancelled_by_collector']);

const paymentIdOf = (payment) => String(payment?.id ?? '').trim();

const markPurchaseEmailSent = async (orderNumber) => {
  await prisma.orders.update({
    where: { order_number: orderNumber },
    data: { purchase_email_sent_at: new Date() },
  });
};

export const applyPaymentToOrder = async (payment) => {
  const orderId = String(payment?.external_reference ?? '').trim();
  if (!orderId) return { status: 'ignored', reason: 'missing_external_reference' };

  if (payment.status === 'approved') {
    const paymentId = paymentIdOf(payment);

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({ where: { id: orderId } });
      if (!order) return null;

      if (order.mp_payment_id && order.mp_payment_id === paymentId) {
        return null;
      }

      if (order.mp_payment_id && order.mp_payment_id !== paymentId) {
        throw new Error("La orden ya tiene otro pago asociado.");
      }

      const paymentAmount = Number(payment.transaction_amount);
      const orderTotal = Number(order.total);
      if (!Number.isFinite(paymentAmount) || paymentAmount < orderTotal) {
        throw new Error("Pago parcial no permitido");
      }

      if (order.status !== 'pending' && order.status !== 'confirmed') {
        return null;
      }

      return await tx.orders.update({
        where: { id: orderId },
        data: {
          status: 'confirmed',
          mp_payment_id: paymentId,
          updated_at: new Date(),
        },
      });
    });

    if (updatedOrder && !updatedOrder.purchase_email_sent_at) {
      const fullOrder = { ...updatedOrder, items: updatedOrder.items };
      const emailResult = await sendOrderEmails(fullOrder).catch((error) => {
        console.error("Error enviando email por Mercado Pago:", error);
        return { ok: false };
      });

      if (emailResult.ok) {
        await markPurchaseEmailSent(updatedOrder.order_number);
      }
    }

    return updatedOrder
      ? { status: 'confirmed', order: updatedOrder }
      : { status: 'already_processed' };
  }

  if (REJECTED_PAYMENT_STATUSES.has(payment.status)) {
    const cancelled = await cancelOrderAndReleaseStockService(orderId);
    return cancelled
      ? { status: 'cancelled', order: cancelled }
      : { status: 'ignored', reason: 'order_not_pending' };
  }

  return { status: 'ignored', reason: `payment_status_${payment.status || 'unknown'}` };
};
