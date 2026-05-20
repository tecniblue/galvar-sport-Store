import React, { useContext } from "react";
import { AlertCircle, CheckCircle2, Info, Zap } from "lucide-react";
import { useUIStore, useAuthStore, useCatalogStore, useCartStore } from "../../store";

export default function Toast() {
  const toast = useUIStore(state => state.toast);
  const styles = {
    success: {
      icon: <CheckCircle2 className="text-green-400" size={18} />,
      className: "border-green-500/50 text-green-400",
    },
    error: {
      icon: <AlertCircle className="text-red-400" size={18} />,
      className: "border-red-500/50 text-red-300",
    },
    info: {
      icon: <Info className="text-sky-400" size={18} />,
      className: "border-sky-500/50 text-sky-300",
    },
  };
  const current = styles[toast.type] || styles.info;

  return (
    <div
      className={`fixed top-24 left-1/2 -translate-x-1/2 z-[300] transition-all duration-500 pointer-events-none ${
        toast.show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-12"
      }`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={`glass border px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl uppercase italic text-sm ${current.className}`}>
        {toast.type ? current.icon : <Zap className="fill-current" size={18} />}
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}
