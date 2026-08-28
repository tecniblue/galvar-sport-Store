export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(amount);
};

export const formatDate = (dateValue = new Date()) => {
  const date = new Date(dateValue);

  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    dateStyle: "full",
    timeStyle: "short",
  }).format(Number.isNaN(date.getTime()) ? new Date() : date);
};

export const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const toHtmlText = (value) =>
  escapeHtml(value).replace(/[^\x20-\x7E]/g, (char) => `&#${char.codePointAt(0)};`);

export const getItemQuantity = (item) => Number(item.quantity ?? item.qty ?? 1) || 1;

export const formatFulfillment = (fulfillment) => {
  const labels = {
    pickup: "Retiro en tienda",
    delivery: "Delivery local",
    chilexpress: "Chilexpress",
  };

  return labels[fulfillment] || toHtmlText(fulfillment || "No informado");
};

export const formatPaymentMethod = (paymentMethod) => {
  const labels = {
    card: "Tarjeta",
    whatsapp: "WhatsApp",
    transfer: "Transferencia",
  };

  return labels[paymentMethod] || toHtmlText(paymentMethod || "No informado");
};

export const ORDER_STATUS_LABELS = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  shipped: "En camino",
  completed: "Completado",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_MESSAGES = {
  pending: "Tu pedido fue recibido y est&aacute; pendiente de confirmaci&oacute;n.",
  confirmed: "Tu pedido fue confirmado. Estamos preparando tus productos.",
  shipped: "Tu pedido ya est&aacute; en camino.",
  completed: "Tu pedido fue completado. Gracias por comprar en Galvar Sport.",
  cancelled: "Tu pedido fue cancelado. Si tienes dudas, cont&aacute;ctanos para ayudarte.",
};

export const getOrderStatusLabel = (status) =>
  ORDER_STATUS_LABELS[status] || "Actualizado";
