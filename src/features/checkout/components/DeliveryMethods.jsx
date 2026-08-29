import React, { memo } from "react";
import { Store, Truck } from "lucide-react";

export const DeliveryMethods = memo(function DeliveryMethods({ fulfillment, setFulfillment, paymentMethod, persistPrefs }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-400 font-black text-sm border border-green-500/30">2</span>
        <h2 className="text-[14px] font-black uppercase tracking-widest text-white">
          Métodos de Entrega
        </h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setFulfillment("pickup");
            persistPrefs({ fulfillment: "pickup", paymentMethod });
          }}
          className={`rounded-3xl border p-4 text-left transition-all ${
            fulfillment === "pickup"
              ? "border-green-500/40 bg-zinc-900/70"
              : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white">
            <Store size={16} className="text-green-500" /> Retiro en tienda
          </div>
          <div className="mt-2 text-[11px] uppercase tracking-widest text-zinc-500 font-bold">
            Antofagasta
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setFulfillment("chilexpress");
            persistPrefs({ fulfillment: "chilexpress", paymentMethod });
          }}
          className={`rounded-3xl border p-4 text-left transition-all ${
            fulfillment === "chilexpress"
              ? "border-green-500/40 bg-zinc-900/70"
              : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white">
            <Truck size={16} className="text-green-500" /> Chilexpress
          </div>
          <div className="mt-2 text-[11px] uppercase tracking-widest text-zinc-500 font-bold leading-relaxed">
            Costo de envío se paga por separado.
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setFulfillment("delivery");
            persistPrefs({ fulfillment: "delivery", paymentMethod });
          }}
          className={`rounded-3xl border p-4 text-left transition-all ${
            fulfillment === "delivery"
              ? "border-green-500/40 bg-zinc-900/70"
              : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white">
            <Truck size={16} className="text-green-500" /> Delivery
          </div>
          <div className="mt-2 text-[11px] uppercase tracking-widest text-zinc-500 font-bold">
            Solo Antofagasta
          </div>
        </button>
      </div>
    </div>
  );
});
