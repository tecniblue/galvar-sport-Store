import React from "react";
import { Loader2, CheckCircle2, Lock } from "lucide-react";

export const CHECKOUT_STEPS = [
  "Procesando compra...",
  "Enviando confirmacion...",
  "Finalizando pedido...",
];

export const MP_CHECKOUT_STEPS = [
  "Preparando pago...",
  "Procesando pago...",
  "Estamos verificando tu pago...",
];

export function CheckoutProcessingOverlay({ message, steps = CHECKOUT_STEPS }) {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/75 backdrop-blur-md px-6">
      <div className="w-full max-w-md rounded-[2rem] border border-green-500/25 bg-zinc-950/95 p-7 shadow-2xl shadow-green-500/10">
        <div className="flex items-center gap-4">
          <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-green-500 text-black shadow-lg shadow-green-500/25">
            <Loader2 size={28} className="animate-spin" />
            <span className="absolute inset-0 rounded-2xl border border-green-300/60 animate-ping" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-green-400">
              Compra segura
            </p>
            <p className="mt-1 text-lg font-black uppercase text-white">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {steps.map((step, index) => {
            const active = step === message;
            const done = steps.indexOf(message) > index;
            return (
              <div
                key={step}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300 ${
                  active
                    ? "border-green-500/40 bg-green-500/10 text-white"
                    : done
                      ? "border-green-500/20 bg-zinc-900 text-zinc-300"
                      : "border-zinc-800 bg-zinc-950 text-zinc-600"
                }`}
              >
                {done ? (
                  <CheckCircle2 size={16} className="text-green-400" />
                ) : (
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      active ? "bg-green-400 animate-pulse" : "bg-zinc-700"
                    }`}
                  />
                )}
                <span className="text-[11px] font-black uppercase tracking-widest">
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <Lock size={16} className="mt-0.5 shrink-0 text-green-400" />
          <p className="text-xs font-bold leading-relaxed text-zinc-400">
            No cierres esta ventana. Estamos guardando tu orden y confirmando los correos.
          </p>
        </div>
      </div>
    </div>
  );
}
