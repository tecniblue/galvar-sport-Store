import React, { useEffect, useId, useRef, useState } from "react";
import BlockingOverlay from "../../../components/ui/BlockingOverlay";

const maskValue = (value) => {
  const text = String(value || "").trim();
  if (text.length <= 12) return text || "missing";
  return `${text.slice(0, 6)}...${text.slice(-4)}`;
};

const publicKeyModeOf = (publicKey) => {
  const key = String(publicKey || "").trim();
  if (key.startsWith("APP_USR-")) return "production";
  if (key.startsWith("TEST-")) return "test";
  return key ? "unknown" : "missing";
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRenderingRef = useRef(false);
  const rafRef = useRef(null);
  const shouldEnableWallet =
    import.meta.env.VITE_MP_ENABLE_WALLET !== "false" &&
    !String(publicKey || "").startsWith("TEST-");
  const shouldEnableCards = import.meta.env.VITE_MP_ENABLE_CARDS !== "false";

  useEffect(() => {
    const validPublicKey = String(publicKey || "").trim();
    const validPreferenceId = String(preferenceId || "").trim();
    const validAmount = Number(amount);

    if (isRenderingRef.current) return;

    if (!validPublicKey || !Number.isFinite(validAmount) || validAmount <= 0 || !validPreferenceId) {
      const error = new Error("Configuracion invalida para cargar Mercado Pago.");
      console.error("[MP BRICK] Invalid initialization", {
        publicKeyMode: publicKeyModeOf(publicKey),
        preferenceId: maskValue(preferenceId),
        amount,
        wallet: shouldEnableWallet,
        cards: shouldEnableCards,
      });
      if (onError) onError(error);
      return;
    }

    console.info("[MP BRICK]", {
      publicKeyMode: publicKeyModeOf(publicKey),
      preferenceId: maskValue(preferenceId),
      amount: validAmount,
      wallet: shouldEnableWallet,
      cards: shouldEnableCards,
    });

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

        if (shouldEnableWallet && validPreferenceId) {
          paymentMethods.mercadoPago = "all";
        }

        const controller = await bricksBuilder.create(
          "payment",
          containerId,
          {
            initialization: {
              amount: validAmount,
              preferenceId: validPreferenceId,
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
                  setIsSubmitting(true);
                  const normalizedPaymentData = {
                    ...(formData ?? {}),
                    selected_payment_method: selectedPaymentMethod,
                    payment_method_id: formData?.payment_method_id,
                    additional_data: additionalData ?? null,
                    transaction_amount: formData?.transaction_amount || validAmount,
                    description,
                    external_reference: externalReference,
                    payment_attempt_id:
                      window.crypto?.randomUUID?.() ||
                      `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                  };

                  onSubmit({
                    ...normalizedPaymentData,
                  })
                    .then(resolve)
                    .catch(reject)
                    .finally(() => setIsSubmitting(false));
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
    <div className="relative w-full bg-zinc-950 p-2 rounded-[2.5rem] border border-zinc-900 shadow-2xl">
      <BlockingOverlay show={isSubmitting} message="Procesando pago..." />
      <div
        id={containerId}
        ref={containerRef}
        style={{ minHeight: "420px" }}
      ></div>
    </div>
  );
};
