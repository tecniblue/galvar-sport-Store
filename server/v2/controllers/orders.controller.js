import { sendOrderEmails, sendOrderStatusEmail } from '../../services/email/email.service.js';
import { 
  fetchAllOrders, 
  fetchOrderByClient, 
  insertSecureOrderService, 
  updateOrderStatusService, 
  deleteOrderService 
} from '../services/orders.service.js';
import { prisma } from '../prisma.js';


export const getOrders = async (req, res) => {
  try {
    const orders = await fetchAllOrders();
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Error al obtener órdenes" });
  }
};

export const getOrderByClient = async (req, res) => {
  try {
    const { clientOrderId } = req.params;
    
    if (!clientOrderId) {
      return res.status(400).json({ error: "Falta client_order_id" });
    }

    const order = await fetchOrderByClient(clientOrderId);
    
    if (!order) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order by client_order_id:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { order, duplicate } = await insertSecureOrderService(req.body, 'whatsapp');
    const fullOrder = { ...order };

    if (!duplicate && fullOrder.payment_method === 'whatsapp' && !fullOrder.purchase_email_sent_at) {
      const emailResult = await sendOrderEmails(fullOrder);
      if (emailResult.ok) {
        fullOrder.purchase_email_sent_at = new Date();
        await prisma.orders.update({
          where: { order_number: fullOrder.order_number },
          data: { purchase_email_sent_at: fullOrder.purchase_email_sent_at }
        });
      }
    }

    res.status(201).json(fullOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(400).json({ error: error.message || "Error al crear la orden" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await updateOrderStatusService(id, status);
    
    if (!updatedOrder) {
      return res.status(404).json({ error: "Orden no encontrada." });
    }

    const fullOrder = { ...updatedOrder };
    
    let emailSent = false;
    if (!fullOrder.status_email_sent_at) {
      emailSent = await sendOrderStatusEmail(fullOrder);
      if (emailSent) {
        await prisma.orders.update({
          where: { order_number: fullOrder.order_number },
          data: { status_email_sent_at: new Date() }
        });
      }
    }
    
    res.json({ ...fullOrder, statusEmailSent: emailSent });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Error al actualizar estado de la orden" });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await deleteOrderService(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Orden no encontrada." });
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Error al eliminar la orden" });
  }
};
