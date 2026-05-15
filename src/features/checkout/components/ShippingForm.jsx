import React, { memo, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { CHILE_REGIONS } from "../utils/chile-data";

export const ShippingForm = memo(function ShippingForm({ region, setRegion, comuna, setComuna, address, setAddress, errors }) {
  
  useEffect(() => {
    if (region) {
      const regionData = CHILE_REGIONS.find(r => r.name === region);
      if (regionData && !regionData.communes.includes(comuna)) {
        setComuna("");
      }
    }
  }, [region, comuna, setComuna]);

  const selectedRegionData = CHILE_REGIONS.find(r => r.name === region);
  const communes = selectedRegionData ? selectedRegionData.communes : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-400 font-black text-sm border border-green-500/30">2</span>
        <h2 className="text-[14px] font-black uppercase tracking-widest text-white">
          Datos de Envío
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Región
          </label>
          <div className="relative">
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className={`w-full bg-zinc-900 border rounded-2xl py-4 pl-5 pr-12 text-xs font-bold text-white uppercase outline-none transition-colors focus:border-green-500 appearance-none cursor-pointer ${
                errors.region ? "border-red-500/60" : "border-zinc-800"
              }`}
            >
              <option value="" disabled>SELECCIONA TU REGIÓN</option>
              {CHILE_REGIONS.map((r) => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
          {errors.region ? (
            <p className="text-[11px] font-bold text-red-400">{errors.region}</p>
          ) : null}
        </div>
        
        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Comuna
          </label>
          <div className="relative">
            <select
              value={comuna}
              onChange={(event) => setComuna(event.target.value)}
              disabled={!region}
              className={`w-full bg-zinc-900 border rounded-2xl py-4 pl-5 pr-12 text-xs font-bold text-white uppercase outline-none transition-colors focus:border-green-500 appearance-none ${
                !region ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              } ${
                errors.comuna ? "border-red-500/60" : "border-zinc-800"
              }`}
            >
              <option value="" disabled>SELECCIONA TU COMUNA</option>
              {communes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={16} className={`absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none ${!region ? "text-zinc-700" : "text-zinc-500"}`} />
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
      </div>
    </div>
  );
});
