import React, { useMemo, memo } from "react";
import { AlertCircle, Loader2, MessageSquare, ShieldCheck } from "lucide-react";

export const OrderSummary = memo(function OrderSummary({
  cart,
  total,
  formatCLP,
  stockIssues,
  errors,
  checkoutError,
  isPaying,
  paymentMethod,
  checkoutStep,
  handlePay,
}) {
  const renderedCartItems = useMemo(() => cart.map((item) => (
    <div key={`${item.id}-${item.size || 'default'}`} className="flex items-start gap-3">
      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center text-zinc-600 font-black italic text-[10px]">
        {item.images?.[0] ? (
          <img
            src={item.images[0]}
            alt=""
            className="w-full h-full object-cover opacity-90"
            loading="lazy"
            decoding="async"
          />
        ) : (
          item.label || "GS"
        )}
      </div>
      <div className="min-w-0 flex-grow">
        <div className="flex justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase text-white truncate">
              {item.name}
            </p>
            {item.size ? (
              <p className="text-[9px] font-black uppercase text-zinc-500 mt-0.5">
                Talla: {item.size}
              </p>
            ) : null}
          </div>
          <p className="text-[10px] font-black text-green-500 tabular-nums">
            $
            {formatCLP(
              (Number(item.price) || 0) * (Number(item.qty) || 0),
            )}
          </p>
        </div>
        <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mt-1">
          {Number(item.qty) || 0} x ${formatCLP(item.price)}
        </p>
      </div>
    </div>
  )), [cart, formatCLP]);

  return (
    <aside className="lg:col-span-2 glass rounded-[3rem] border border-zinc-900 p-8 md:p-10 text-left space-y-6 h-fit sticky top-28">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">
          Resumen
        </p>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
          {cart.length} productos
        </span>
      </div>

      <div className="space-y-3">
        {renderedCartItems}
      </div>

      <div className="pt-6 border-t border-zinc-900 flex justify-between items-center">
        <span className="text-zinc-500 text-[11px] font-black uppercase">
          Total
        </span>
        <span className="text-3xl font-black text-white tabular-nums">
          ${formatCLP(total)}
        </span>
      </div>

      {errors.stock ? (
        <p className="text-[11px] font-bold text-red-400">{errors.stock}</p>
      ) : null}

      {checkoutError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-100">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
          <p className="text-xs font-bold leading-relaxed">{checkoutError}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handlePay}
        disabled={isPaying || stockIssues.length > 0}
        className={`w-full py-5 rounded-2xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
          paymentMethod === "whatsapp"
            ? "bg-green-500 hover:bg-green-400 text-black shadow-green-500/20"
            : "bg-white hover:bg-green-500 text-black shadow-white/10"
        } ${
          isPaying || stockIssues.length > 0
            ? "opacity-70 cursor-not-allowed"
            : ""
        }`}
      >
        {isPaying ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {checkoutStep}
          </>
        ) : paymentMethod === "whatsapp" ? (
          <>
            Confirmar por WhatsApp{" "}
            <MessageSquare size={18} className="fill-current" />
          </>
        ) : (
          <>
            Pagar con Mercado Pago{" "}
            <ShieldCheck size={18} className="fill-current" />
          </>
        )}
      </button>

      <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold leading-relaxed">
        {paymentMethod === "whatsapp"
          ? "Te llevamos a WhatsApp para coordinar pago y envío o retiro."
          : "Serás redirigido a Mercado Pago para realizar tu compra de forma segura."}
      </p>
    </aside>
  );
});
