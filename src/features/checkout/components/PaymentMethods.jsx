import React, { memo } from "react";
import { ShieldCheck, MessageSquare } from "lucide-react";

export const PaymentMethods = memo(function PaymentMethods({ paymentMethod, setPaymentMethod, fulfillment, persistPrefs }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-400 font-black text-sm border border-green-500/30">4</span>
        <h2 className="text-[14px] font-black uppercase tracking-widest text-white">
          Métodos de Pago
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setPaymentMethod("mercadopago");
            persistPrefs({ fulfillment, paymentMethod: "mercadopago" });
          }}
          className={`rounded-3xl border p-4 text-left transition-all ${
            paymentMethod === "mercadopago"
              ? "border-blue-500/40 bg-zinc-900/70"
              : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white">
            <ShieldCheck size={16} className="text-blue-500" /> Mercado Pago
          </div>
          <div className="mt-2 text-[11px] uppercase tracking-widest text-zinc-500 font-bold">
            Tarjetas y saldo MP
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setPaymentMethod("whatsapp");
            persistPrefs({ fulfillment, paymentMethod: "whatsapp" });
          }}
          className={`rounded-3xl border p-4 text-left transition-all ${
            paymentMethod === "whatsapp"
              ? "border-green-500/40 bg-zinc-900/70"
              : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white">
            <MessageSquare size={16} className="text-green-500" /> WhatsApp
          </div>
          <div className="mt-2 text-[11px] uppercase tracking-widest text-zinc-500 font-bold">
            Coordinado directamente con la tienda
          </div>
        </button>
      </div>
    </div>
  );
});
