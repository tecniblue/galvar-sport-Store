import React, { useEffect, useRef } from "react";
import { LogOut } from "lucide-react";
import { useAuthStore } from "../../../store";

const DEFAULT_IDLE_TIMEOUT_MINUTES = 5;

const getIdleTimeoutMs = () => {
  const minutes = Number(import.meta.env.VITE_ADMIN_IDLE_TIMEOUT_MINUTES || DEFAULT_IDLE_TIMEOUT_MINUTES);
  return Math.max(1, Number.isFinite(minutes) ? minutes : DEFAULT_IDLE_TIMEOUT_MINUTES) * 60 * 1000;
};

export default function AdminLayout({ tabs, activeTab, onTabChange, children }) {
  const logoutAdmin = useAuthStore(state => state.logoutAdmin);
  const logoutRef = useRef(logoutAdmin);

  useEffect(() => {
    logoutRef.current = logoutAdmin;
  }, [logoutAdmin]);

  useEffect(() => {
    const idleTimeoutMs = getIdleTimeoutMs();
    let timeoutId;

    const resetIdleTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        logoutRef.current();
      }, idleTimeoutMs);
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "focus"];
    events.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });
    resetIdleTimer();

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
    };
  }, []);

  return (
    <div className="pt-28 sm:pt-32 pb-20 container mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 text-left">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter text-white">
            Panel <span className="text-green-500">Admin</span>
          </h1>
        </div>
        <button
          onClick={logoutAdmin}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-zinc-800 bg-zinc-900 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all"
        >
          <LogOut size={16} /> Salir
        </button>
      </div>

      <div className="flex overflow-x-auto gap-4 mb-10 pb-2 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] whitespace-nowrap transition-all border ${
                activeTab === tab.id
                  ? "bg-green-500 text-black border-green-500"
                  : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {children}
    </div>
  );
}
