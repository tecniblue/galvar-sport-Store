import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

export const createMercadoPagoService = (accessToken) => {
  if (!accessToken) {
    console.warn("Mercado Pago Access Token not provided. Payments will not work.");
    return null;
  }

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
        const body = {
          items: orderData.items.map((item) => ({
            id: String(item.id),
            title: item.name,
            description: item.variant ? `Variant: ${item.variant}` : item.name,
            picture_url: item.image || undefined,
            quantity: Number(item.qty),
            unit_price: Number(item.price),
            currency_id: 'CLP',
          })),
          payer: {
            name: orderData.customerName,
            email: orderData.customerEmail,
            phone: {
              number: orderData.customerPhone,
            },
          },
          back_urls: {
            success: `${baseUrl}/checkout/success?status=approved`,
            failure: `${baseUrl}/checkout/success?status=failure`,
            pending: `${baseUrl}/checkout/success?status=pending`,
          },
          auto_return: 'approved',
          external_reference: String(orderData.id),
          notification_url: `${baseUrl}/api/mercadopago/webhook`,
          statement_descriptor: 'GALVAR SPORT',
        };

        const preference = await preferenceService.create({ body });
        return preference;
      } catch (error) {
        console.error("Error creating Mercado Pago preference:", error);
        throw new Error("No se pudo inicializar el pago con Mercado Pago");
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
    }
  };
};
