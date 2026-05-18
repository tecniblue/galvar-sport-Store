import React, { useState } from "react";
import { useAuthStore } from "../../../store";

export default function AdminAccessGate({ children }) {
  const isAdmin = useAuthStore(state => state.isAdmin);
  const loginAdmin = useAuthStore(state => state.loginAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAdmin) return children;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await loginAdmin(email, password);
    } catch (err) {
      setError(err.message || "Credenciales invalidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] pt-32 pb-20 px-6 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="glass p-8 rounded-[2rem] border border-zinc-800 w-full max-w-sm space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-black italic uppercase text-white">Acceso Admin</h2>
        </div>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Correo Electronico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-green-500"
            required
          />
          <input
            type="password"
            placeholder="Contrasena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-green-500"
            required
          />
        </div>
        {error ? <p className="text-xs font-bold text-red-500 text-center">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-black py-4 rounded-xl font-black uppercase italic tracking-widest hover:bg-white transition-all disabled:opacity-50"
        >
          {loading ? "Cargando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
