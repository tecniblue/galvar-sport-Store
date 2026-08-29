import React, { memo } from "react";
import { MapPin } from "lucide-react";

export const DeliveryForm = memo(function DeliveryForm({ address, setAddress, notes, setNotes, errors }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-400 font-black text-sm border border-green-500/30">3</span>
        <h2 className="text-[14px] font-black uppercase tracking-widest text-white">
          Datos de Delivery
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Comuna
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 py-4 px-5 text-xs font-bold text-white uppercase">
            <MapPin size={16} className="text-green-500 shrink-0" />
            Antofagasta
          </div>
          {errors.comuna ? (
            <p className="text-[11px] font-bold text-red-400">{errors.comuna}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Dirección exacta
          </label>
          <input
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className={`w-full bg-zinc-900 border rounded-2xl py-4 px-5 text-xs font-bold text-white uppercase outline-none transition-colors focus:border-green-500 ${
              errors.address ? "border-red-500/60" : "border-zinc-800"
            }`}
            placeholder="CALLE, NÚMERO, DPTO/CASA"
          />
          {errors.address ? (
            <p className="text-[11px] font-bold text-red-400">{errors.address}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Referencia de entrega (opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-5 text-xs font-bold text-white uppercase outline-none transition-colors focus:border-green-500"
            placeholder="CASA ESQUINA, PORTÓN, CONDOMINIO, ETC."
          />
        </div>
      </div>
    </div>
  );
});
