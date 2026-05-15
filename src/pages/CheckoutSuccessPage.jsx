import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ShieldCheck,
  ShoppingBag,
  Truck,
  Store,
  MessageSquare,
  CreditCard,
  Copy,
  Check,
  ArrowRight,
  Home,
} from "lucide-react";
import { fetchOrderByClient } from "../services/api";
import { AppContext } from "../context/AppContext";

const formatCLP = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString("es-CL") : "0";
};

function OrderIdBadge({ order }) {
  const [copied, setCopied] = useState(false);
  const orderNum = order?.order_number
    ? `#${String(order.order_number).padStart(4, "0")}`
    : order?.id
      ? `#${String(order.id).slice(-8).toUpperCase()}`
      : "#????";

  const handleCopy = () => {
    navigator.clipboard
      .writeText(orderNum)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(() => { });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-green-500/50 rounded-2xl px-5 py-3 transition-all"
      title="Copiar número de pedido"
    >
      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
        Pedido
      </span>
      <span className="font-black text-lg text-green-500 tracking-widest font-mono">
        {orderNum}
      </span>
      <span className="ml-auto text-zinc-600 group-hover:text-green-500 transition-colors">
        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
      </span>
    </button>
  );
}

export default function CheckoutSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const externalRef = searchParams.get("external_reference");
  const mpStatus = searchParams.get("status");
  const orderFromState = location.state?.order ?? null;
  const { setCart } = React.useContext(AppContext);

  const [orderData, setOrderData] = useState(() => orderFromState || null);
  const [isLoading, setIsLoading] = useState(!orderFromState && !!externalRef);

  useEffect(() => {
    if (!orderData && externalRef) {
      setIsLoading(true);
      fetchOrderByClient(externalRef)
        .then(data => {
          setOrderData({
            ...data,
            customerName: data.customer_name || data.customerName,
            customerPhone: data.customer_phone || data.customerPhone,
            customerEmail: data.customer_email || data.customerEmail,
            paymentMethod: data.payment_method || data.paymentMethod || "mercadopago",
            mpStatus,
          });
          setCart([]); // Clear cart when order is fetched from MP
        })
        .catch(err => {
          console.error("Error al cargar orden:", err);
          // Fallback mínimo para mostrar al menos el número de pedido
          setOrderData({
            id: externalRef,
            paymentMethod: "mercadopago",
            mpStatus,
            customerName: "Guerrero",
            items: [],
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [externalRef, orderData, mpStatus]);

  // Si alguien accede directamente sin datos, redirigir a la tienda
  useEffect(() => {
    if (!isLoading && !orderData) {
      const timer = setTimeout(() => navigate("/tienda"), 3000);
      return () => clearTimeout(timer);
    }
  }, [orderData, navigate, isLoading]);

  if (isLoading) {
    return (
      <div className="pt-28 sm:pt-36 container mx-auto px-6 pb-24 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-green-500 rounded-full animate-spin mb-4" />
        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
          Cargando tu pedido...
        </p>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="pt-28 sm:pt-36 container mx-auto px-6 pb-24 flex flex-col items-center justify-center min-h-[60vh]">
        <ShieldCheck size={40} className="text-zinc-700 mb-4" />
        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
          Redirigiendo a la tienda…
        </p>
      </div>
    );
  }

  const {
    id,
    customerName,
    customerPhone,
    customerEmail,
    fulfillment,
    paymentMethod,
    address,
    items = [],
    total,
    notes,
  } = orderData;

  const isWhatsApp = paymentMethod === "whatsapp";
  const isDelivery = fulfillment === "delivery";

  return (
    <div className="pt-28 sm:pt-32 md:pt-36 pb-24 container mx-auto px-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Hero de confirmación ────────────────────────────────── */}
        <div className="glass rounded-[3rem] border border-green-500/20 bg-green-500/[0.03] p-10 md:p-14 relative overflow-hidden">
          {/* Glow decorativo */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10">
            {/* Icono */}
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 grid place-items-center mb-6 text-green-500">
              <ShieldCheck size={32} strokeWidth={1.5} />
            </div>

            {/* Título */}
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500 mb-2">
              ¡Pedido recibido!
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none text-white mb-4">
              Gracias,{" "}
              <span className="text-green-500">
                {customerName?.split(" ")[0] || "Guerrero"}
              </span>
            </h1>
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest max-w-lg">
              {isWhatsApp
                ? "Te contactaremos por WhatsApp para confirmar tu pedido y coordinar el pago."
                : "Tu pedido ha sido registrado exitosamente. Pronto nos pondremos en contacto contigo."}
            </p>

            {/* ID de orden */}
            {(orderData.id || orderData.order_number) && (
              <div className="mt-8">
                <OrderIdBadge order={orderData} />
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-2 pl-1">
                  Usa este número para consultas — el admin lo verá igual en el panel de órdenes
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Resumen de compra ──────────────────────────────────── */}
        <div className="glass rounded-[2.5rem] border border-zinc-800 p-8 md:p-10 space-y-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Resumen del pedido
          </p>

          {/* Productos */}
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="flex items-center gap-4 py-3 border-b border-zinc-900 last:border-0"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center text-zinc-600 font-black italic text-[9px] overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="w-full h-full object-cover opacity-80"
                      loading="lazy"
                    />
                  ) : (
                    item.label || "GS"
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-[11px] font-black uppercase text-white truncate">
                    {item.name}
                  </p>
                  {item.sku && (
                    <p className="text-[9px] font-bold text-green-500 uppercase">
                      SKU: {item.sku}
                    </p>
                  )}
                  {item.variant && (
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">
                      {item.variant}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-black text-green-500 tabular-nums">
                    ${formatCLP((item.price ?? 0) * (item.qty ?? 1))}
                  </p>
                  <p className="text-[9px] font-bold text-zinc-600 tabular-nums">
                    x{item.qty}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Total
            </span>
            <span className="text-3xl font-black text-white tabular-nums">
              ${formatCLP(total)}
            </span>
          </div>
        </div>

        {/* ── Información de entrega y pago ─────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Entrega */}
          <div className="glass rounded-[2rem] border border-zinc-800 p-6 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              {(isDelivery || fulfillment === "chilexpress") ? (
                <Truck size={14} className="text-green-500" />
              ) : (
                <Store size={14} className="text-green-500" />
              )}
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {fulfillment === "chilexpress" ? "Envío por Chilexpress" : isDelivery ? "Envío a domicilio" : "Retiro en tienda"}
              </p>
            </div>
            {(isDelivery || fulfillment === "chilexpress") && address ? (
              <p className="text-[11px] font-bold text-zinc-300">{address}</p>
            ) : (
              <p className="text-[11px] font-bold text-zinc-300">
                Galvar Sport — Antofagasta
              </p>
            )}
            {customerPhone && (
              <p className="text-[10px] font-bold text-zinc-500">{customerPhone}</p>
            )}
            {customerEmail && (
              <p className="text-[10px] font-bold text-zinc-500">{customerEmail}</p>
            )}
          </div>

          {/* Método de pago */}
          <div className="glass rounded-[2rem] border border-zinc-800 p-6 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              {isWhatsApp ? (
                <MessageSquare size={14} className="text-green-500" />
              ) : (
                <CreditCard size={14} className="text-green-500" />
              )}
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Método de pago
              </p>
            </div>
            <p className="text-[11px] font-bold text-zinc-300">
              {isWhatsApp ? "WhatsApp — Coordinación directa" : paymentMethod === "mercadopago" ? "Mercado Pago" : "Tarjeta (procesado)"}
            </p>
            {notes && (
              <p className="text-[10px] font-bold text-zinc-500 italic border-l-2 border-zinc-700 pl-2">
                "{notes}"
              </p>
            )}
          </div>
        </div>

        {/* ── Próximos pasos ─────────────────────────────────────── */}
        <div className="glass rounded-[2rem] border border-zinc-800 p-6 md:p-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">
            ¿Qué sigue?
          </p>
          <div className="space-y-4">
            {[
              {
                step: "01",
                text: isWhatsApp
                  ? "Responde el mensaje de WhatsApp para confirmar tu pedido."
                  : "Recibirás una notificación con el estado de tu pedido.",
              },
              {
                step: "02",
                text: isDelivery
                  ? "Coordinamos el envío a tu domicilio en Antofagasta."
                  : "Te avisaremos cuando tu pedido esté listo para retiro.",
              },
              {
                step: "03",
                text: "¡Disfruta tu equipamiento Galvar Sport!",
              },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-4">
                <span className="text-[9px] font-black text-green-500 tabular-nums w-6 shrink-0 mt-0.5">
                  {step}
                </span>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Botones de acción ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/tienda")}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-500 text-black font-black text-[11px] uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-green-500/20 active:scale-95"
          >
            Seguir comprando
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white font-black text-[11px] uppercase tracking-widest hover:border-zinc-600 transition-all active:scale-95"
          >
            <Home size={15} />
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
