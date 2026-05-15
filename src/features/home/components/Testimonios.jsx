import React, { useRef } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

const TESTIMONIOS_DATA = [
  {
    name: "Andrés Silva",
    text: "Excelente calidad en los guantes de boxeo. La atención en la tienda de Antofagasta es de primera.",
  },
  {
    name: "Carla Méndez",
    text: "Encontré todo lo necesario para empezar Muay Thai. Los precios son muy competitivos.",
  },
  {
    name: "Roberto Jara",
    text: "Las mejores marcas para MMA en el norte. Muy recomendada la asesoría que brindan.",
  },
  {
    name: "Diego Torres",
    text: "El mejor equipamiento técnico. El envío llegó rapidísimo y en perfectas condiciones a Santiago.",
  },
  {
    name: "Valentina Ríos",
    text: "Increíble durabilidad de los sacos y manoplas. Llevo meses entrenando pesado y siguen como nuevos.",
  }
];

export default function Testimonios() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -350 : 350;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="py-24 bg-zinc-950 border-t border-zinc-900 overflow-hidden relative">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
          <h2 className="text-3xl md:text-4xl font-black italic uppercase text-center md:text-left tracking-tighter text-white leading-none">
            Lo que dicen <br className="hidden md:block" />
            <span className="text-green-500">nuestros clientes</span>
          </h2>
          <div className="flex gap-2">
            <button onClick={() => scroll("left")} className="w-12 h-12 rounded-full border border-zinc-800 bg-black flex items-center justify-center text-white hover:bg-green-500 hover:text-black hover:border-green-500 transition-all">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => scroll("right")} className="w-12 h-12 rounded-full border border-zinc-800 bg-black flex items-center justify-center text-white hover:bg-green-500 hover:text-black hover:border-green-500 transition-all">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex gap-6 md:gap-8 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
          {TESTIMONIOS_DATA.map((t) => (
            <div key={t.name} className="min-w-[280px] md:min-w-[360px] snap-start bg-black p-8 md:p-10 rounded-[2.5rem] border border-zinc-900 hover:border-green-500/30 transition-colors flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex text-green-500 mb-6">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} size={16} className="fill-current" />
                  ))}
                </div>
                <p className="text-zinc-400 italic mb-8 text-lg leading-relaxed">"{t.text}"</p>
              </div>
              <p className="font-black uppercase text-[10px] tracking-widest text-white flex items-center gap-3">
                <span className="w-6 h-[1px] bg-green-500"></span> {t.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}