import React from "react";
import { Target, Compass } from "lucide-react";

export default function MissionVision() {
  return (
    <section className="py-16 bg-zinc-950 border-t border-zinc-900 relative overflow-hidden">
      {/* Luces de fondo decorativas */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-500/5 blur-[140px] rounded-full pointer-events-none transform-gpu" />
      <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-500/5 blur-[140px] rounded-full pointer-events-none transform-gpu" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-green-500 font-bold uppercase tracking-[0.4em] text-[10px] md:text-xs mb-3">
            FILOSOFÍA Y PROPÓSITO
          </p>
          <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">
            Nuestra <span className="text-green-500">Esencia</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* TARJETA MISIÓN */}
          <div className="glass border border-zinc-800/80 rounded-[2rem] p-6 md:p-8 relative overflow-hidden group hover:border-green-500/50 transition-all duration-500 hover:-translate-y-1 flex flex-col justify-between shadow-2xl">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-500 pointer-events-none transform-gpu" />
            
            <div>
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-green-500 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-md">
                <Target size={24} />
              </div>

              <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-white mb-4 flex items-center gap-3">
                Misión
              </h3>

              <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm font-normal">
                Brindar soluciones en el campo del deporte a nivel regional y nacional a través de la innovación, servicio y calidad de los productos que ofrecemos. Nuestros recursos están destinados a contribuir con el desarrollo de la salud física y mental, logrando así cumplir con el compromiso adquirido con nuestro público.
              </p>
            </div>

            <div className="pt-6 border-t border-zinc-800/50 mt-6 flex items-center justify-between text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500">
              <span>Compromiso Galvar</span>
              <span className="text-green-500">Innovación & Calidad</span>
            </div>
          </div>

          {/* TARJETA VISIÓN */}
          <div className="glass border border-zinc-800/80 rounded-[2rem] p-6 md:p-8 relative overflow-hidden group hover:border-green-500/50 transition-all duration-500 hover:-translate-y-1 flex flex-col justify-between shadow-2xl">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-500 pointer-events-none transform-gpu" />
            
            <div>
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-green-500 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-md">
                <Compass size={24} />
              </div>

              <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-white mb-4 flex items-center gap-3">
                Visión
              </h3>

              <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm font-normal">
                Galvar Sport comienza como un emprendimiento en tiempos de pandemia, buscando fomentar el deporte mediante implementos y artículos deportivos. Busca posicionarse en la región, brindando productos de alta calidad para la práctica del deporte tanto a nivel recreativo como profesional, ofreciendo soluciones para las distintas necesidades, utilizando una plataforma tecnológica que simplifique y facilite los procesos de las distintas áreas, comprometidos a apoyar la salud mental y física de nuestros clientes.
              </p>
            </div>

            <div className="pt-6 border-t border-zinc-800/50 mt-6 flex items-center justify-between text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500">
              <span>Proyección</span>
              <span className="text-green-500">Liderazgo Regional</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
