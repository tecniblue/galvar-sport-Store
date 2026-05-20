import React from "react";
import { Loader2 } from "lucide-react";

export default function BlockingOverlay({ show, message = "Procesando..." }) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="rounded-2xl border border-green-500/25 bg-zinc-950 px-6 py-5 shadow-2xl shadow-green-500/10 flex items-center gap-3">
        <Loader2 size={20} className="animate-spin text-green-500" />
        <span className="text-xs font-black uppercase tracking-widest text-white">{message}</span>
      </div>
    </div>
  );
}
