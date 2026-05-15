export const digitsOnly = (value) => String(value ?? "").replace(/[^\d]/g, "");

export const formatRut = (value) => {
  let raw = value.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
  if (raw.length <= 1) return raw;
  const dv = raw.slice(-1);
  const rutStr = raw.slice(0, -1);
  return `${rutStr}-${dv}`;
};

export const createClientOrderId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `order-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};
