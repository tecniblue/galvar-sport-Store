const API_BASE = "/api";
const CSRF_COOKIE_NAME = "gs_csrf";

const readCookie = (name) => {
  if (typeof document === "undefined") return "";
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=") || "";
};

const needsCsrf = (method = "GET") => !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());

const parseJson = async (response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

async function apiFetch(path, options = {}) {
  const method = options.method || "GET";
  const csrfToken = needsCsrf(method) ? readCookie(CSRF_COOKIE_NAME) : "";
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": decodeURIComponent(csrfToken) } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    let message = payload?.error || `Request failed with status ${response.status}`;
    if (payload?.details) {
      message += `: ${typeof payload.details === 'object' ? JSON.stringify(payload.details) : payload.details}`;
    }
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

export const processMercadoPagoPayment = (paymentData) =>
  apiFetch("/mercadopago/process_payment", {
    method: "POST",
    body: JSON.stringify(paymentData),
  });

export const deleteOrder = (orderId) =>
  apiFetch(`/orders/${orderId}`, {
    method: "DELETE",
  });

export const fetchOrderByClient = (clientOrderId) =>
  apiFetch(`/orders/client/${clientOrderId}`);

export const createProduct = (product) =>
  apiFetch("/catalog/products", {
    method: "POST",
    body: JSON.stringify(product),
  });

export const updateProduct = (id, product) =>
  apiFetch(`/catalog/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(product),
  });

export const deleteProduct = (id) =>
  apiFetch(`/catalog/products/${id}`, {
    method: "DELETE",
  });

export const createCategory = (categoryData) =>
  apiFetch("/catalog/categories", {
    method: "POST",
    body: JSON.stringify(categoryData),
  });

export const updateCategory = (name, categoryData) =>
  apiFetch(`/catalog/categories/${encodeURIComponent(name)}`, {
    method: "PATCH",
    body: JSON.stringify(categoryData),
  });

export const deleteCategory = (name, targetCategory) =>
  apiFetch(`/catalog/categories/${encodeURIComponent(name)}`, {
    method: "DELETE",
    body: JSON.stringify({ targetCategory }),
  });

// --- FIGHTERS ---
export const createFighter = (fighter) =>
  apiFetch("/catalog/fighters", {
    method: "POST",
    body: JSON.stringify(fighter),
  });

export const updateFighter = (id, fighter) =>
  apiFetch(`/catalog/fighters/${id}`, {
    method: "PATCH",
    body: JSON.stringify(fighter),
  });

export const deleteFighter = (id) =>
  apiFetch(`/catalog/fighters/${id}`, {
    method: "DELETE",
  });

// --- ALLIANCES ---
export const createAlliance = (alliance) =>
  apiFetch("/catalog/alliances", {
    method: "POST",
    body: JSON.stringify(alliance),
  });

export const updateAlliance = (id, alliance) =>
  apiFetch(`/catalog/alliances/${id}`, {
    method: "PATCH",
    body: JSON.stringify(alliance),
  });

export const deleteAlliance = (id) =>
  apiFetch(`/catalog/alliances/${id}`, {
    method: "DELETE",
  });
