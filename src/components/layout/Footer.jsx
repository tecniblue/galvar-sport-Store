import React from "react";
import { Link } from "react-router-dom";
import { MapPin, MessageCircle, Mail, ShieldCheck, CreditCard } from "lucide-react";
import Logo from "../brand/Logo/Logo";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Clodomiro+Rozas+965,+Antofagasta,+Chile";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-950 pt-12 md:pt-28 pb-6 md:pb-10 border-t border-zinc-900 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-green-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 mb-10 md:mb-20">

          {/* Columna 1: Brand & Info */}
          <div className="lg:col-span-4 flex flex-col items-start text-left space-y-4 md:space-y-6">
            <Logo isNavbar isStatic />
            <p className="text-zinc-500 text-xs font-bold leading-relaxed max-w-sm">
              Equipamiento deportivo premium para atletas exigentes. Rendimiento, diseño y durabilidad garantizados.
            </p>
            <div className="space-y-3">
              <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-zinc-400 hover:text-green-500 transition-colors text-[11px] font-bold uppercase tracking-widest group">
                <MapPin size={16} className="text-zinc-600 group-hover:text-green-500 transition-colors" />
                Antofagasta, Chile
              </a>
              <a href="mailto:ventas@galvarsport.com" className="flex items-center gap-3 text-zinc-400 hover:text-green-500 transition-colors text-[11px] font-bold uppercase tracking-widest group">
                <Mail size={16} className="text-zinc-600 group-hover:text-green-500 transition-colors" />
                ventas@galvarsport.com
              </a>
            </div>
          </div>

          {/* Columna 2: Tienda */}
          <div className="lg:col-span-2 flex flex-col text-left space-y-4 md:space-y-6">
            <h3 className="text-white text-xs font-black uppercase tracking-[0.2em]">Tienda</h3>
            <ul className="space-y-3 md:space-y-4">
              <li>
                <Link to="/tienda" className="text-zinc-500 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors inline-block">
                  Productos
                </Link>
              </li>
              <li>
                <Link to="/tienda" className="text-zinc-500 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors inline-block flex items-center gap-2">
                  Ofertas <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-[9px]">HOT</span>
                </Link>
              </li>
              <li>
                <a href="https://wa.me/56971413309" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors inline-block">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3: Atención al Cliente */}
          <div className="lg:col-span-3 flex flex-col text-left space-y-4 md:space-y-6">
            <h3 className="text-white text-xs font-black uppercase tracking-[0.2em]">Atención Cliente</h3>
            <ul className="space-y-3 md:space-y-4">
              <li>
                <Link to="/info/envios" className="text-zinc-500 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors inline-block">
                  Envíos y Entregas
                </Link>
              </li>
              <li>
                <Link to="/info/cambios" className="text-zinc-500 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors inline-block">
                  Cambios y Devoluciones
                </Link>
              </li>
              <li>
                <Link to="/info/faq" className="text-zinc-500 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors inline-block">
                  Preguntas Frecuentes (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Legal & Social */}
          <div className="lg:col-span-3 flex flex-col text-left space-y-4 md:space-y-6">
            <h3 className="text-white text-xs font-black uppercase tracking-[0.2em]">Legal & Comunidad</h3>
            <ul className="space-y-3 md:space-y-4 mb-4 md:mb-6">
              <li>
                <Link to="/info/privacidad" className="text-zinc-500 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors inline-block">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link to="/info/terminos" className="text-zinc-500 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors inline-block">
                  Términos y Condiciones
                </Link>
              </li>
            </ul>
            <div className="flex gap-4">
              <a href="https://instagram.com/galvarsport" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-900 hover:text-green-500 hover:border-green-500/30 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a href="https://wa.me/56971413309" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-900 hover:text-green-500 hover:border-green-500/30 transition-all">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

        </div>

        {/* Separator */}
        <div className="w-full h-px bg-zinc-900 mb-8"></div>

        {/* Bottom Bar: Copyright & Payments */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] order-2 md:order-1 text-center md:text-left">
            © {currentYear} Galvar Sport • Antofagasta, Chile • Todos los derechos reservados.
            <Link to="/admin" className="hover:text-zinc-400 ml-3 transition-colors">
              Admin
            </Link>
          </p>

          <div className="flex items-center gap-4 order-1 md:order-2">
            <div className="flex items-center gap-2 text-zinc-500 px-3 py-1.5 rounded-lg border border-zinc-800/50 bg-zinc-900/20">
              <ShieldCheck size={14} className="text-zinc-400" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Compra 100% Segura</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-500 px-3 py-1.5 rounded-lg border border-zinc-800/50 bg-zinc-900/20">
              <CreditCard size={14} className="text-zinc-400" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Mercado Pago</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
