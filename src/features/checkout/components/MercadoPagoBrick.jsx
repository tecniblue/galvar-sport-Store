import React, { useEffect, useId, useRef } from "react";

/**
 * MercadoPagoBrick Component
 * Renders the Payment Brick from Mercado Pago
 */
export const MercadoPagoBrick = ({
  publicKey,
  amount,
  preferenceId,
  description,
  externalReference,
  payerEmail,
  onSubmit,
  onError,
  onReady,
}) => {
  const uid = useId().replace(/:/g, "");
  const containerId = `mp-brick-${uid}`;
  const containerRef = useRef(null);
  const brickControllerRef = useRef(null);
  const isRenderingRef = useRef(false);
  const rafRef = useRef(null);
  const shouldEnableWallet =
    import.meta.env.VITE_MP_ENABLE_WALLET === "true" &&
    !String(publicKey || "").startsWith("TEST-");
  const shouldEnableCards = import.meta.env.VITE_MP_ENABLE_CARDS !== "false";

  useEffect(() => {
    if (isRenderingRef.current || !preferenceId) return;

    // Flag de cancelación por closure para manejar React StrictMode:
    // en DEV React hace mount → cleanup → remount; si el cleanup corre
    // antes de que la Promise resuelva, desmontamos el controller recién creado.
    let cancelled = false;

    const initBrick = async () => {
      if (!window.MercadoPago || !containerRef.current) return;

      containerRef.current.innerHTML = "";
      isRenderingRef.current = true;

      try {
        const mp = new window.MercadoPago(publicKey, { locale: "es-CL" });
        const bricksBuilder = mp.bricks();

        const paymentMethods = {};

        if (shouldEnableCards) {
          paymentMethods.creditCard = "all";
          paymentMethods.debitCard = "all";
        }

        if (shouldEnableWallet) {
          paymentMethods.mercadoPago = ["wallet_purchase"];
        }

        const controller = await bricksBuilder.create(
          "payment",
          containerId,
          {
            initialization: {
              amount: amount,
              preferenceId: preferenceId,
              payer: { email: payerEmail, entityType: "individual" },
            },
            customization: {
              visual: {
                theme: "dark",
                preserveLayout: true,
              },
              paymentMethods,
            },
            callbacks: {
              onReady: () => {
                isRenderingRef.current = false;
                if (onReady) onReady();
              },
              onSubmit: ({ selectedPaymentMethod, formData }, additionalData) => {
                return new Promise((resolve, reject) => {
                  const normalizedPaymentData = {
                    ...(formData ?? {}),
                    selected_payment_method: selectedPaymentMethod,
                    payment_method_id: formData?.payment_method_id,
                    additional_data: additionalData ?? null,
                    transaction_amount: formData?.transaction_amount || amount,
                    description,
                    external_reference: externalReference,
                  };

                  onSubmit({
                    ...normalizedPaymentData,
                  })
                    .then(resolve)
                    .catch(reject);
                });
              },
              onError: (error) => {
                isRenderingRef.current = false;
                console.error("Payment Brick Error:", error);
                if (onError) onError(error);
              },
            },
          }
        );

        // Si el cleanup corrió mientras esperábamos (StrictMode double-invoke),
        // desmontamos inmediatamente en lugar de guardar la referencia.
        if (cancelled) {
          controller.unmount();
          isRenderingRef.current = false;
        } else {
          brickControllerRef.current = controller;
        }
      } catch (err) {
        if (!cancelled) {
          isRenderingRef.current = false;
          console.error("Error initializing brick:", err);
        }
      }
    };

    // Esperar un frame para asegurar que el contenedor tiene dimensiones
    // antes de que el SDK intente renderizar sus SVGs.
    rafRef.current = requestAnimationFrame(() => {
      initBrick();
    });

    return () => {
      cancelled = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (brickControllerRef.current) {
        brickControllerRef.current.unmount();
        brickControllerRef.current = null;
      }
      isRenderingRef.current = false;
    };
  }, [publicKey, preferenceId]);

  return (
    <div className="w-full bg-zinc-950 p-2 rounded-[2.5rem] border border-zinc-900 shadow-2xl">
      <div
        id={containerId}
        ref={containerRef}
        style={{ minHeight: "420px" }}
      ></div>
    </div>
  );
};
