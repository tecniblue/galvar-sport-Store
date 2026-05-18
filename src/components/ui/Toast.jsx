import React, { useContext } from "react";
import { Zap } from "lucide-react";
import { useUIStore, useAuthStore, useCatalogStore, useCartStore } from "../../store";

export default function Toast() {
  const toast = useUIStore(state => state.toast);

  return (
    <div
      className={`fixed top-24 left-1/2 -translate-x-1/2 z-[300] transition-all duration-500 pointer-events-none ${
        toast.show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-12"
      }`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="glass border border-green-500/50 text-green-400 px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl uppercase italic text-sm">
        <Zap className="fill-current" size={18} />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}
