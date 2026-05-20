import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useCatalogStore, useCartStore, useUIStore } from "../store";
import { saveOrder, createMercadoPagoPreference, processMercadoPagoPayment } from "../services/api";
import { MercadoPagoBrick } from "../features/checkout/components/MercadoPagoBrick";

import { digitsOnly, formatRut, createClientOrderId } from "../features/checkout/utils/checkout.utils";
import { CHECKOUT_STEPS, MP_CHECKOUT_STEPS, CheckoutProcessingOverlay } from "../features/checkout/components/CheckoutProcessingOverlay";
import { ClientForm } from "../features/checkout/components/ClientForm";
import { ShippingForm } from "../features/checkout/components/ShippingForm";
import { DeliveryMethods } from "../features/checkout/components/DeliveryMethods";
import { PaymentMethods } from "../features/checkout/components/PaymentMethods";
import { OrderSummary } from "../features/checkout/components/OrderSummary";

const MERCADO_PAGO_STATUS_MESSAGES = {
  cc_rejected_other_reason:
    "El pago fue rechazado por Mercado Pago. No se realizo ningun cobro. Intenta nuevamente o usa otra tarjeta.",
  cc_rejected_insufficient_amount:
    "El pago fue rechazado por fondos insuficientes. No se realizo ningun cobro. Prueba con otra tarjeta o medio de pago.",
  cc_rejected_bad_filled_security_code:
    "El codigo de seguridad de la tarjeta no es valido. Revisa el CVV e intenta nuevamente.",
  cc_rejected_bad_filled_date:
    "La fecha de vencimiento de la tarjeta no es valida. Revisa mes y ano e intenta nuevamente.",
  cc_rejected_bad_filled_other:
    "Hay un error en los datos de la tarjeta. Revisa la informacion ingresada e intenta nuevamente.",
  cc_rejected_call_for_authorize:
    "El pago necesita autorizacion del emisor de la tarjeta. Contacta a tu banco o intenta con otra tarjeta.",
};

const getMercadoPagoStatusMessage = (result) => {
  const detail = String(result?.status_detail || "").trim();
  if (detail && MERCADO_PAGO_STATUS_MESSAGES[detail]) {
    return MERCADO_PAGO_STATUS_MESSAGES[detail];
  }

  return "No pudimos procesar el pago. No se realizo ningun cobro. Intenta nuevamente o usa otra tarjeta.";
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const cart = useCartStore(state => state.cart);
  const setCart = useCartStore(state => state.setCart);
  const products = useCatalogStore(state => state.products);
  const checkoutPrefs = useCartStore(state => state.checkoutPrefs);
  const setCheckoutPrefs = useCartStore(state => state.setCheckoutPrefs);
  const showSuccess = useUIStore(state => state.showSuccess);
  const showError = useUIStore(state => state.showError);
  const showInfo = useUIStore(state => state.showInfo);

  const formatCLP = useCallback((value) => {
    const num = typeof value === "number" ? value : Number(value);
    return (Number.isFinite(num) ? num : 0).toLocaleString("es-CL");
  }, []);

  const total = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = Number(item?.effectivePrice ?? item?.price) || 0;
      const qty = Number(item?.qty) || 0;
      return acc + price * qty;
    }, 0);
  }, [cart]);

  const initialPrefs = useMemo(() => {
    const state =
      location.state && typeof location.state === "object" ? location.state : null;
    const merged = { ...(checkoutPrefs ?? {}), ...(state ?? {}) };
    return {
      fulfillment: ["pickup", "delivery", "chilexpress"].includes(merged.fulfillment)
        ? merged.fulfillment
        : "pickup",
      paymentMethod: ["mercadopago", "whatsapp"].includes(merged.paymentMethod) ? merged.paymentMethod : "whatsapp",
    };
  }, [checkoutPrefs, location.state]);

  const [fulfillment, setFulfillment] = useState(initialPrefs.fulfillment);
  const [paymentMethod, setPaymentMethod] = useState(initialPrefs.paymentMethod);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [rut, setRut] = useState("");
  const [region, setRegion] = useState("");
  const [comuna, setComuna] = useState("");

  const [errors, setErrors] = useState({});
  const [isPaying, setIsPaying] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(CHECKOUT_STEPS[0]);
  const [checkoutError, setCheckoutError] = useState("");
  const [showMPBrick, setShowMPBrick] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [mpStep, setMpStep] = useState(MP_CHECKOUT_STEPS[0]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [preferenceId, setPreferenceId] = useState(null);
  const submitLockRef = useRef(false);
  const clientOrderIdRef = useRef(createClientOrderId());

  const cartIsEmpty = cart.length === 0;

  useEffect(() => {
    if (!isPaying) return undefined;

    const timers = [
      window.setTimeout(() => setCheckoutStep(CHECKOUT_STEPS[1]), 900),
      window.setTimeout(() => setCheckoutStep(CHECKOUT_STEPS[2]), 2200),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [isPaying]);

  const stockIssues = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((productItem) => productItem.id === item.id);
        if (!product) {
          return `${item.name}: ya no existe en el catalogo.`;
        }

        let available = Number(product.stock) || 0;
        if (item.size) {
          const sInfo = (product.stockBySize || product.stock_by_size || {})[item.size];
          if (sInfo) {
            available = Number(sInfo.stock) || 0;
          }
        }

        const requested = Number(item?.qty) || 0;

        if (available <= 0) {
          return `${item.name}${item.size ? ` (${item.size})` : ""}: sin stock disponible.`;
        }

        if (requested > available) {
          return `${item.name}${item.size ? ` (${item.size})` : ""}: solo quedan ${available} unidades.`;
        }

        return null;
      })
      .filter(Boolean);
  }, [cart, products]);

  const persistPrefs = useCallback(
    (next) => setCheckoutPrefs(next),
    [setCheckoutPrefs],
  );

  const validate = useCallback(() => {
    const nextErrors = {};

    const rawRut = String(rut).replace(/[^0-9kK]/gi, '');
    if (!rawRut) {
      nextErrors.rut = "Ingresa tu RUT.";
    } else if (rawRut.length !== 9) {
      nextErrors.rut = "El RUT debe tener 9 dígitos.";
    }
    
    if (!String(fullName).trim()) nextErrors.fullName = "Ingresa tu nombre.";
    if (!String(phone).trim()) {
      nextErrors.phone = "Ingresa tu telefono.";
    } else if (digitsOnly(phone).length !== 9) {
      nextErrors.phone = "El teléfono debe tener 9 dígitos.";
    }
    if (!String(email).trim()) {
      nextErrors.email = "Ingresa tu email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Ingresa un email válido.";
    }

    if (fulfillment !== "pickup") {
      if (!String(region).trim()) nextErrors.region = "Ingresa tu región.";
      if (!String(comuna).trim()) nextErrors.comuna = "Ingresa tu comuna.";
      if (!String(address).trim()) nextErrors.address = "Ingresa tu dirección.";
    }

    if (stockIssues.length > 0) {
      nextErrors.stock = "Tu carrito necesita revision por cambios de stock.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [
    address,
    region,
    comuna,
    email,
    fulfillment,
    fullName,
    phone,
    rut,
    stockIssues.length,
  ]);

  const buildWhatsAppMessage = useCallback(() => {
    const lines = [];
    lines.push("*NUEVO PEDIDO GALVAR SPORT*");
    lines.push(`CLIENTE: ${String(fullName).trim().toUpperCase()}`);
    lines.push(`TEL: ${String(phone).trim()}`);
    if (String(email).trim()) lines.push(`EMAIL: ${String(email).trim()}`);
    const entregaStr = fulfillment === "delivery" ? "Delivery local" : fulfillment === "chilexpress" ? "Envio Chilexpress" : "Retiro en tienda";
    lines.push(`ENTREGA: ${entregaStr}`);
    
    if (fulfillment === "chilexpress") {
      if (String(rut).trim()) lines.push(`RUT: ${String(rut).trim()}`);
      lines.push(`REGION: ${String(region).trim()}`);
      lines.push(`COMUNA: ${String(comuna).trim()}`);
      lines.push(`DIRECCION EXACTA: ${String(address).trim()}`);
    } else if (fulfillment === "delivery") {
      lines.push(`DIRECCION: ${String(address).trim()}`);
    }
    if (String(notes).trim()) lines.push(`NOTAS: ${String(notes).trim()}`);
    lines.push("PAGO: WhatsApp");
    lines.push("");

    cart.forEach((item) => {
      const qty = Number(item?.qty) || 0;
      const name = String(item?.name ?? "").trim();
      const sku = String(item?.sku ?? "").trim();
      const variant = String(item?.variant ?? "").trim();
      if (!qty || !name) return;

      lines.push(`- ${qty}x ${name}${sku ? ` (SKU: ${sku})` : ""}`);
      if (variant) lines.push(`  Diseno: ${variant}`);
      lines.push("");
    });

    lines.push(`TOTAL ESTIMADO: $${formatCLP(total)}`);
    if (cart.some(item => item.isWeeklyOffer)) {
      lines.push("_* Incluye productos en oferta_");
    }
    lines.push("");
    lines.push("Favor confirmar stock.");
    return lines.join("\n");
  }, [address, cart, region, comuna, email, formatCLP, fulfillment, fullName, notes, phone, rut, total]);

  const finalizeOrder = useCallback((savedOrderId, savedOrderNumber, savedEmailResult, forcedStatus = null) => {
    const orderSummary = {
      id: savedOrderId ?? `GS-${Date.now().toString(36).toUpperCase()}`,
      order_number: savedOrderNumber ?? null,
      customerName: String(fullName).trim(),
      customerPhone: String(phone).trim(),
      customerEmail: String(email).trim(),
      rut: String(rut).trim(),
      comunaRegion: `${String(comuna).trim()}, ${String(region).trim()}`,
      fulfillment,
      paymentMethod,
      address: String(address).trim(),
      notes: String(notes).trim(),
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        label: item.label,
        image: item.images?.[0] ?? "",
        variant: item.variant,
        size: item.size,
        qty: Number(item.qty) || 0,
        price: Number(item.effectivePrice ?? item.price) || 0,
        originalPrice: Number(item.price) || 0,
        isOffer: Boolean(item.isWeeklyOffer),
      })),
      total,
      status: forcedStatus || (paymentMethod === "whatsapp" ? "confirmed" : "pending"),
      emailResult: savedEmailResult ?? null,
    };

    setCart([]);
    navigate("/checkout/success", { state: { order: orderSummary }, replace: true });
  }, [address, cart, region, comuna, email, fulfillment, fullName, navigate, notes, paymentMethod, phone, rut, setCart, total]);

  const buildOrderPayload = useCallback(() => ({
    clientOrderId: clientOrderIdRef.current,
    customerName: String(fullName).trim(),
    customerPhone: String(phone).trim(),
    customerEmail: String(email).trim(),
    rut: String(rut).trim(),
    comunaRegion: `${String(comuna).trim()}, ${String(region).trim()}`,
    fulfillment,
    paymentMethod,
    address: String(address).trim(),
    notes: String(notes).trim(),
    items: cart.map((item) => ({
      id: item.id,
      size: item.size,
      qty: Number(item.qty) || 0,
    })),
  }), [address, cart, region, comuna, email, fulfillment, fullName, notes, paymentMethod, phone, rut]);

  const handlePay = async () => {
    if (cartIsEmpty || isPaying || submitLockRef.current) return;
    const ok = validate();
    if (!ok) return;

    persistPrefs({ fulfillment, paymentMethod });
    setCheckoutError("");
    setCheckoutStep(CHECKOUT_STEPS[0]);
    setIsPaying(true);
    submitLockRef.current = true;
    const whatsappWindow =
      paymentMethod === "whatsapp" ? window.open("about:blank", "_blank") : null;

    try {
      if (paymentMethod === "mercadopago") {
        // createMercadoPagoPreference ya crea la orden internamente; NO llamar saveOrder por separado
        const preference = await createMercadoPagoPreference(buildOrderPayload());
        if (preference && preference.id && preference.order) {
          setPreferenceId(preference.id);
          setCurrentOrder(preference.order);
          setShowMPBrick(true);
          showInfo("Formulario de pago listo");
        } else {
          throw new Error("No se pudo iniciar el pago con Mercado Pago");
        }
        setIsPaying(false);
        submitLockRef.current = false;
        return;
      }

      const saved = await saveOrder(buildOrderPayload());

      if (paymentMethod === "whatsapp") {
        const msg = buildWhatsAppMessage();
        const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "56971413309";
        const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
        if (whatsappWindow) {
          whatsappWindow.location.href = url;
        } else {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }

      setCheckoutStep(CHECKOUT_STEPS[2]);
      await new Promise((resolve) => setTimeout(resolve, 350));
      showSuccess("Pedido creado");
      finalizeOrder(saved?.id, saved?.order_number, saved?.emailResult);
    } catch (error) {
      console.error("Checkout failed", error);
      whatsappWindow?.close();
      setCheckoutError(
        error?.message || "No pudimos finalizar tu compra. Intentalo nuevamente.",
      );
      showError(error?.message || "No pudimos finalizar tu compra.");
      setIsPaying(false);
      submitLockRef.current = false;
    }
  };


  return (
    <div className="pt-28 sm:pt-32 md:pt-36 container mx-auto px-6 pb-20 md:pb-24">
      {isPaying ? <CheckoutProcessingOverlay message={checkoutStep} /> : null}
      {isProcessingPayment ? <CheckoutProcessingOverlay message={mpStep} steps={MP_CHECKOUT_STEPS} /> : null}
      <div className="flex items-center justify-between gap-6 mb-10 md:mb-14">
        <div className="text-left">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none text-white">
            Checkout <span className="text-green-500">Seguro</span>
          </h1>
          <p className="mt-3 text-zinc-500 uppercase tracking-widest text-xs font-bold italic">
            Completa tus datos y confirma el pago
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-2xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-white font-black uppercase text-[10px] tracking-widest transition-all"
        >
          <ArrowLeft size={16} /> Volver
        </button>
      </div>

      {cartIsEmpty ? (
        <div className="glass rounded-[3rem] border border-zinc-900 p-10 text-center opacity-80">
          <p className="text-sm font-black uppercase tracking-widest text-zinc-400">
            Tu pedido esta vacio
          </p>
          <button
            type="button"
            onClick={() => navigate("/tienda")}
            className="mt-6 px-8 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-green-500 transition-all"
          >
            Ir a la tienda
          </button>
        </div>
      ) : showMPBrick ? (
        <div className="max-w-6xl mx-auto">
          {/* Header de la fase de pago */}
          <div className="flex items-center gap-4 mb-10">
             <div className="h-px flex-grow bg-zinc-800"></div>
             <div className="flex items-center gap-3">
                <CreditCard className="text-green-500" size={20} />
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Procesar Pago Seguro</h2>
             </div>
             <div className="h-px flex-grow bg-zinc-800"></div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Columna del Formulario */}
            <div className="lg:col-span-7 space-y-6">
              <div className="glass rounded-[3rem] border border-zinc-900 p-2 overflow-hidden shadow-2xl shadow-black/50">
                <MercadoPagoBrick
                  key={preferenceId}
                  publicKey={import.meta.env.VITE_MP_PUBLIC_KEY}
                  amount={total}
                  preferenceId={preferenceId}
                  description={`Pedido Galvar Sport #${currentOrder?.order_number || ""}`}
                  externalReference={currentOrder?.id}
                  payerEmail={email}
                  onSubmit={async (paymentData) => {
                    try {
                      setCheckoutError("");
                      setIsProcessingPayment(true);
                      setMpStep(MP_CHECKOUT_STEPS[1]);
                      if (paymentData.selected_payment_method === "wallet_purchase") {
                        setCheckoutError(
                          "Se abrió Mercado Pago en otra pestaña. Completa el pago allí y vuelve a la tienda desde Mercado Pago.",
                        );
                        return;
                      }

                      const result = await processMercadoPagoPayment(paymentData);
                      setMpStep(MP_CHECKOUT_STEPS[2]);
                      if (result.status === "approved" || result.status === "in_process" || result.status === "pending") {
                        const finalStatus = result.status === "approved" ? "confirmed" : "pending";
                        showSuccess(result.status === "approved" ? "Pago aprobado" : "Pago en verificacion");
                        finalizeOrder(currentOrder?.id, currentOrder?.order_number, null, finalStatus);
                      } else {
                        throw new Error(getMercadoPagoStatusMessage(result));
                      }
                    } catch (err) {
                      setCheckoutError(err.message || "Error al procesar el pago");
                      showError(err.message || "Error al procesar el pago");
                      throw err;
                    } finally {
                      setIsProcessingPayment(false);
                      setMpStep(MP_CHECKOUT_STEPS[0]);
                    }
                  }}
                  onError={() => {
                    setCheckoutError("Error al cargar el formulario de pago.");
                    showError("Error al cargar Mercado Pago.");
                  }}
                />
              </div>

              <div className="flex items-center justify-between px-6">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                   <ShieldCheck size={14} className="text-green-500" />
                   Pago encriptado por Mercado Pago
                </div>
                <button
                  onClick={() => setShowMPBrick(false)}
                  disabled={isProcessingPayment}
                  className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={12} /> Cancelar y volver
                </button>
              </div>
            </div>

            {/* Columna del Resumen (Derecha) */}
            <aside className="lg:col-span-5 space-y-6 sticky top-32">
              <div className="glass rounded-[3rem] border border-zinc-900 p-8 md:p-10 shadow-2xl shadow-black/50">
                 <h3 className="text-xl font-black italic uppercase text-white mb-8 flex items-center gap-3">
                   <ShoppingBag size={20} className="text-green-500" />
                   Resumen
                 </h3>
                 
                 <div className="space-y-4 mb-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                   {cart.map(item => (
                     <div key={item.id + (item.variant || '')} className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex-shrink-0 overflow-hidden">
                           {item.images?.[0] ? (
                             <img src={item.images[0]} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                           ) : <div className="w-full h-full grid place-items-center text-[10px] text-zinc-700">GS</div>}
                        </div>
                        <div className="flex-grow min-w-0">
                           <p className="text-[11px] font-black uppercase text-white truncate">{item.name}</p>
                           <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">
                              {item.qty} unidad{item.qty > 1 ? 'es' : ''} {item.variant ? `— ${item.variant}` : ''} {item.size ? `(${item.size})` : ''}
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-[11px] font-black text-white italic">${formatCLP(item.price * item.qty)}</p>
                        </div>
                     </div>
                   ))}
                 </div>

                 <div className="space-y-3 pt-6 border-t border-zinc-800/50">
                    <div className="flex justify-between items-center opacity-60">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Subtotal</span>
                       <span className="text-xs font-black text-white">${formatCLP(total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">Total a pagar</span>
                       <span className="text-4xl font-black italic text-white tracking-tighter">${formatCLP(total)}</span>
                    </div>
                 </div>
              </div>

              {checkoutError && (
                <div className="p-5 rounded-3xl border border-red-500/20 bg-red-500/5 text-red-500 flex gap-3 items-start animate-in fade-in slide-in-from-top-4 duration-300">
                   <AlertCircle size={18} className="shrink-0 mt-0.5" />
                   <p className="text-xs font-bold leading-relaxed">{checkoutError}</p>
                </div>
              )}
            </aside>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-8 md:gap-10">
          <section className="lg:col-span-3 glass rounded-[3rem] border border-zinc-900 p-8 md:p-10 text-left space-y-12">
            {stockIssues.length > 0 ? (
              <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 mb-8">
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-300">
                  Ajusta tu carrito antes de pagar
                </p>
                <div className="mt-3 space-y-2 text-sm text-amber-100">
                  {stockIssues.map((issue) => (
                    <p key={issue}>{issue}</p>
                  ))}
                </div>
              </div>
            ) : null}

            <ClientForm
              rut={rut}
              setRut={setRut}
              fullName={fullName}
              setFullName={setFullName}
              phone={phone}
              setPhone={setPhone}
              email={email}
              setEmail={setEmail}
              notes={notes}
              setNotes={setNotes}
              errors={errors}
              formatRut={formatRut}
              digitsOnly={digitsOnly}
            />

            <div className="h-px w-full bg-zinc-800/50 my-8"></div>

            <DeliveryMethods
              fulfillment={fulfillment}
              setFulfillment={setFulfillment}
              paymentMethod={paymentMethod}
              persistPrefs={persistPrefs}
            />

            {fulfillment !== "pickup" && (
              <>
                <div className="h-px w-full bg-zinc-800/50 my-8"></div>
                <ShippingForm
                  region={region}
                  setRegion={setRegion}
                  comuna={comuna}
                  setComuna={setComuna}
                  address={address}
                  setAddress={setAddress}
                  errors={errors}
                />
              </>
            )}

            <div className="h-px w-full bg-zinc-800/50 my-8"></div>

            <PaymentMethods
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              fulfillment={fulfillment}
              persistPrefs={persistPrefs}
            />
          </section>

          <OrderSummary
            cart={cart}
            total={total}
            formatCLP={formatCLP}
            stockIssues={stockIssues}
            errors={errors}
            checkoutError={checkoutError}
            isPaying={isPaying}
            paymentMethod={paymentMethod}
            checkoutStep={checkoutStep}
            handlePay={handlePay}
          />
        </div>
      )}
    </div>
  );
}
