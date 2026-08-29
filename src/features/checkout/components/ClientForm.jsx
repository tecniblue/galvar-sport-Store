import React, { memo } from "react";

export const ClientForm = memo(function ClientForm({
  rut,
  setRut,
  fullName,
  setFullName,
  phone,
  setPhone,
  email,
  setEmail,
  notes,
  setNotes,
  errors,
  formatRut,
  digitsOnly,
  showNotes = true,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-400 font-black text-sm border border-green-500/30">1</span>
        <h2 className="text-[14px] font-black uppercase tracking-widest text-white">
          Datos del Cliente
        </h2>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
            RUT
          </label>
          <input
            type="text"
            value={rut}
            onChange={(event) => setRut(formatRut(event.target.value))}
            className={`w-full bg-zinc-900 border rounded-2xl py-4 px-5 text-xs font-bold text-white uppercase outline-none transition-colors focus:border-green-500 ${
              errors.rut ? "border-red-500/60" : "border-zinc-800"
            }`}
            placeholder="12345678-9"
          />
          {errors.rut ? (
            <p className="text-[11px] font-bold text-red-400">{errors.rut}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Nombre completo
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className={`w-full bg-zinc-900 border rounded-2xl py-4 px-5 text-xs font-bold text-white uppercase outline-none transition-colors focus:border-green-500 ${
              errors.fullName ? "border-red-500/60" : "border-zinc-800"
            }`}
            placeholder="NOMBRE Y APELLIDO"
          />
          {errors.fullName ? (
            <p className="text-[11px] font-bold text-red-400">{errors.fullName}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Telefono
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(digitsOnly(event.target.value).slice(0, 9))}
            className={`w-full bg-zinc-900 border rounded-2xl py-4 px-5 text-xs font-bold text-white uppercase outline-none transition-colors focus:border-green-500 ${
              errors.phone ? "border-red-500/60" : "border-zinc-800"
            }`}
            placeholder="912345678"
          />
          {errors.phone ? (
            <p className="text-[11px] font-bold text-red-400">{errors.phone}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`w-full bg-zinc-900 border rounded-2xl py-4 px-5 text-xs font-bold text-white uppercase outline-none transition-colors focus:border-green-500 ${
              errors.email ? "border-red-500/60" : "border-zinc-800"
            }`}
            placeholder="correo@dominio.com"
          />
          {errors.email ? (
            <p className="text-[11px] font-bold text-red-400">{errors.email}</p>
          ) : null}
        </div>

        {showNotes ? (
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-5 text-xs font-bold text-white uppercase outline-none transition-colors focus:border-green-500"
              placeholder="TALLA, COLOR, ETC."
            />
          </div>
        ) : null}
      </div>
    </div>
  );
});
