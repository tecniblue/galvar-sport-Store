const API_BASE = "/api";

const parseJson = async (response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    const message =
      payload?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export const bootstrapApp = () => apiFetch("/bootstrap");

export const saveCollection = (key, value) =>
  apiFetch(`/state/${key}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });

export const saveCart = (value) =>
  apiFetch("/cart", {
    method: "PUT",
    body: JSON.stringify({ value }),
  });

export const saveCheckoutPrefs = (value) =>
  apiFetch("/checkout-prefs", {
    method: "PUT",
    body: JSON.stringify({ value }),
  });

export const loginAdmin = (email, password) =>
  apiFetch("/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const logoutAdmin = () =>
  apiFetch("/admin/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });

export const saveOrder = (order) =>
  apiFetch("/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });

export const fetchOrders = () => apiFetch("/orders");

export const updateOrderStatus = (orderId, status) =>
  apiFetch(`/orders/${orderId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

export const createMercadoPagoPreference = (order) =>
  apiFetch("/mercadopago/preference", {
    method: "POST",
    body: JSON.stringify(order),
  });

export const deleteOrder = (orderId) =>
  apiFetch(`/orders/${orderId}`, {
    method: "DELETE",
  });

export const fetchOrderByClient = (clientOrderId) =>
  apiFetch(`/orders/client/${clientOrderId}`);
