import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const credentialModeOf = (accessToken) => {
  const token = String(accessToken || "").trim();
  if (token.startsWith("APP_USR-")) return "production";
  if (token.startsWith("TEST-")) return "test";
  return token ? "unknown" : "missing";
};

const maskValue = (value) => {
  const text = String(value || "").trim();
  if (text.length <= 12) return text || "";
  return `${text.slice(0, 6)}...${text.slice(-4)}`;
};

const errorStatusOf = (error) =>
  error?.status || error?.statusCode || error?.cause?.status || error?.cause?.[0]?.status || null;

const errorCodeOf = (error) =>
  error?.code || error?.cause?.code || error?.cause?.[0]?.code || null;

const errorStatusDetailOf = (error) =>
  error?.status_detail ||
  error?.cause?.status_detail ||
  error?.cause?.[0]?.status_detail ||
  error?.cause?.[0]?.description ||
  null;

const safePaymentLog = (payment, error = null) => ({
  http: errorStatusOf(error),
  code: errorCodeOf(error),
  status: payment?.status || error?.status || null,
  status_detail: payment?.status_detail || errorStatusDetailOf(error),
  payment_id: payment?.id ? String(payment.id) : null,
  payment_method_id: payment?.payment_method_id || null,
});

export const createMercadoPagoService = (accessToken) => {
  if (!accessToken) {
    console.warn("Mercado Pago Access Token not provided. Payments will not work.");
    return null;
  }

  console.info("[MP] Credential mode:", credentialModeOf(accessToken));

  const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
  const preferenceService = new Preference(client);
  const paymentService = new Payment(client);

  return {
    /**
     * Creates a payment preference in Mercado Pago
     * @param {Object} orderData Our internal order data
     * @param {string} baseUrl The base URL of our app for webhooks/callbacks
     * @returns {Promise<Object>} Preference data (including init_point)
     */
    async createPreference(orderData, baseUrl) {
      try {
        const publicOrderRef = String(orderData.client_order_id || orderData.id);
        const items = orderData.items.map((item) => ({
          id: String(item.id),
          title: String(item.name || "Producto").slice(0, 255),
          quantity: Math.max(1, Number(item.qty)),
          unit_price: Math.round(Number(item.price)),
          currency_id: 'CLP',
        }));
        const body = {
          items,
          payer: {
            name: String(orderData.customerName || "Cliente").split(" ")[0],
            surname: String(orderData.customerName || "Galvar").split(" ").slice(1).join(" ") || "Sport",
            email: orderData.customerEmail,
          },
          back_urls: {
            success: `${baseUrl}/checkout/success?status=approved&external_reference=${encodeURIComponent(publicOrderRef)}`,
            failure: `${baseUrl}/checkout/success?status=failure&external_reference=${encodeURIComponent(publicOrderRef)}`,
            pending: `${baseUrl}/checkout/success?status=pending&external_reference=${encodeURIComponent(publicOrderRef)}`,
          },
          notification_url: `${baseUrl}/api/mercadopago/webhook`,
          external_reference: String(orderData.id),
        };

        const amount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
        console.info("[MP] Creating production preference", {
          credentialMode: credentialModeOf(accessToken),
          amount,
          currency: "CLP",
          itemsCount: items.length,
          externalReference: maskValue(orderData.id),
          notificationUrl: body.notification_url,
        });

        const preference = await preferenceService.create({ body });
        console.info("[MP] Preference created", {
          preferenceId: maskValue(preference?.id),
          externalReference: maskValue(orderData.id),
        });
        return preference;
      } catch (error) {
        console.error("[MP] Preference creation failed", {
          http: errorStatusOf(error),
          code: errorCodeOf(error),
          status_detail: errorStatusDetailOf(error),
          message: error?.message,
        });

        const mpCode = error?.code || error?.cause?.[0]?.code;
        const mpMessage = error?.message || error?.cause?.[0]?.description;
        const detail = [mpCode, mpMessage].filter(Boolean).join(": ");

        if (mpCode === "unauthorized" || /invalid access token/i.test(String(mpMessage))) {
          throw new Error("Mercado Pago rechazó el MP_ACCESS_TOKEN: invalid access token");
        }

        throw new Error(
          detail
            ? `No se pudo inicializar el pago con Mercado Pago: ${detail}`
            : "No se pudo inicializar el pago con Mercado Pago"
        );
      }
    },

    /**
     * Retrieves payment info from Mercado Pago
     * @param {string|number} paymentId 
     */
    async getPayment(paymentId) {
      try {
        const payment = await paymentService.get({ id: paymentId });
        return payment;
      } catch (error) {
        console.error("Error fetching Mercado Pago payment:", error);
        throw error;
      }
    },

    async getMerchantOrder(merchantOrderId) {
      try {
        const response = await fetch(`https://api.mercadopago.com/merchant_orders/${merchantOrderId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = payload?.message || payload?.error || `Mercado Pago merchant order failed with status ${response.status}`;
          throw new Error(message);
        }

        return payload;
      } catch (error) {
        console.error("Error fetching Mercado Pago merchant order:", error);
        throw error;
      }
    },

    async searchMerchantOrders({ externalReference, preferenceId, limit = 10 } = {}) {
      try {
        const url = new URL('https://api.mercadopago.com/merchant_orders/search');
        if (externalReference) {
          url.searchParams.set('external_reference', String(externalReference));
        }
        if (preferenceId) {
          url.searchParams.set('preference_id', String(preferenceId));
        }
        url.searchParams.set('limit', String(limit));

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = payload?.message || payload?.error || `Mercado Pago merchant order search failed with status ${response.status}`;
          throw new Error(message);
        }

        return Array.isArray(payload.elements) ? payload.elements : [];
      } catch (error) {
        console.error("Error searching Mercado Pago merchant orders:", error);
        throw error;
      }
    },

    /**
     * Processes a direct payment (from Checkout Bricks)
     * @param {Object} paymentData The data from the Brick (token, amount, etc)
     */
    async processPayment(paymentData) {
      try {
        const paymentMethodId = String(paymentData.payment_method_id || "").trim();
        const selectedPaymentMethod = String(paymentData.selected_payment_method || "").trim();
        const token = String(paymentData.token || "").trim();
        const idempotencyKey = String(paymentData.payment_attempt_id || "").trim();
        const transactionAmount = Number(paymentData.transaction_amount);
        const payerEmail = String(paymentData.payer?.email || "").trim();
        const externalReference = String(paymentData.external_reference || "").trim();
        const cardPaymentTypes = new Set(["credit_card", "debit_card", "prepaid_card"]);

        if (!paymentMethodId) {
          throw new Error("Falta payment_method_id desde Mercado Pago Brick");
        }

        if (cardPaymentTypes.has(selectedPaymentMethod) && !token) {
          throw new Error("Falta token de tarjeta desde Mercado Pago Brick");
        }

        if (!Number.isFinite(transactionAmount) || transactionAmount <= 0) {
          throw new Error("Monto inválido para procesar pago Mercado Pago");
        }

        if (!payerEmail) {
          throw new Error("Falta payer.email desde Mercado Pago Brick");
        }

        if (!externalReference) {
          throw new Error("Falta external_reference para procesar pago Mercado Pago");
        }

        const body = {
          transaction_amount: transactionAmount,
          description: paymentData.description || "Pedido Galvar Sport",
          installments: Number(paymentData.installments) || 1,
          payment_method_id: paymentMethodId,
          payer: {
            email: payerEmail,
          },
          external_reference: externalReference,
          metadata: {
            order_id: externalReference,
          },
        };

        if (paymentData.payer?.identification && paymentData.payer.identification.number) {
          body.payer.identification = paymentData.payer.identification;
        }

        // issuer_id debe ser string numérico (ej. "310") y NO vacío
        if (paymentData.issuer_id && String(paymentData.issuer_id).trim() !== "") {
          body.issuer_id = String(paymentData.issuer_id).trim();
        }

        // Token: obligatorio para tarjetas, ausente para Wallet/QR
        if (token) {
          body.token = token;
        }

        // Campos específicos de Checkout Bricks:
        // point_of_interaction indica que el pago viene de un Brick, no del flujo clásico.
        // Sin este campo, la API de MP puede rechazar con 400.
        if (paymentData.point_of_interaction) {
          body.point_of_interaction = paymentData.point_of_interaction;
        }

        // three_d_secure_mode: enviado cuando la tarjeta requiere autenticación 3DS
        if (paymentData.three_d_secure_mode) {
          body.three_d_secure_mode = paymentData.three_d_secure_mode;
        }

        console.info("[MP] Creating card payment", {
          credentialMode: credentialModeOf(accessToken),
          amount: body.transaction_amount,
          payment_method_id: body.payment_method_id,
          issuer_id: body.issuer_id || null,
          installments: body.installments,
          externalReference: maskValue(body.external_reference),
          hasToken: Boolean(body.token),
          hasIdentification: Boolean(body.payer?.identification?.number),
          idempotencyKey: maskValue(idempotencyKey),
        });

        const requestOptions = idempotencyKey ? { idempotencyKey } : undefined;
        const payment = await paymentService.create({ body, requestOptions });
        console.info("[MP PAYMENT RESPONSE]", safePaymentLog(payment));
        return payment;
      } catch (error) {
        console.error("[MP PAYMENT RESPONSE]", safePaymentLog(null, error));
        throw error;
      }
    }
  };
};
