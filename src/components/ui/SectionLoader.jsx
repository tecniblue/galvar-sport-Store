import React from "react";
import { Loader2 } from "lucide-react";

export function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-2xl bg-zinc-900/80 border border-zinc-800 ${className}`} />;
}

export default function SectionLoader({ message = "Cargando...", rows = 3 }) {
  return (
    <div className="glass rounded-[2rem] border border-zinc-900 p-6">
      <div className="flex items-center gap-3 mb-5 text-zinc-400">
        <Loader2 size={18} className="animate-spin text-green-500" />
        <p className="text-[11px] font-black uppercase tracking-widest">{message}</p>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <SkeletonBlock key={index} className="h-16" />
        ))}
      </div>
    </div>
  );
}
