import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MapPin, Clock, ChevronLeft, ChevronRight, X, Globe, AtSign, Phone, Mail } from 'lucide-react';

const ALIANZAS_DATA = [

];

export default function Alianzas({ alliances }) {
  const scrollRef = useRef(null);
  const cardRefs = useRef([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [selectedSede, setSelectedSede] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const displayData = alliances && alliances.length > 0 ? alliances : ALIANZAS_DATA;

  const updateCarouselState = useCallback(() => {
    const scroller = scrollRef.current;
    const cards = cardRefs.current.filter(Boolean);
    if (!scroller || !cards.length) return;

    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    let nextIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nextIndex = index;
      }
    });

    setActiveIndex(nextIndex);
    setCanScrollLeft(nextIndex > 0);
    setCanScrollRight(nextIndex < cards.length - 1);
  }, []);

  const scrollToIndex = useCallback((index) => {
    const nextCard = cardRefs.current[index];
    if (!nextCard) return;

    nextCard.scrollIntoView({
      behavior: 'smooth',
      inline: 'start',
      block: 'nearest',
    });
  }, []);

  const scroll = useCallback((direction) => {
    const nextIndex =
      direction === 'left'
        ? Math.max(0, activeIndex - 1)
        : Math.min(displayData.length - 1, activeIndex + 1);

    if (nextIndex === activeIndex) return;
    scrollToIndex(nextIndex);
  }, [activeIndex, displayData.length, scrollToIndex]);

  useEffect(() => {
    const initialId = window.setTimeout(updateCarouselState, 0);
    const id = window.setTimeout(updateCarouselState, 250);
    window.addEventListener('resize', updateCarouselState);

    return () => {
      window.clearTimeout(initialId);
      window.clearTimeout(id);
      window.removeEventListener('resize', updateCarouselState);
    };
  }, [displayData.length, updateCarouselState]);

  useEffect(() => {
    if (selectedSede) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedSede]);

  useEffect(() => {
    if (!selectedSede) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedSede(null);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedSede]);

  return (
    <div className="bg-black text-white py-16 md:py-20 px-4 md:px-8 font-sans selection:bg-green-500 selection:text-black border-t border-zinc-900 text-left relative overflow-hidden">
      <style>{`
        .font-oswald { font-family: 'Oswald', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideUp { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header Seccion */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-5 border-b border-zinc-900/50 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-[1px] w-6 bg-green-500"></div>
              <h4 className="font-oswald text-green-500 text-[10px] tracking-[0.32em] uppercase font-bold">Network</h4>
            </div>
            <h2 className="font-oswald text-[clamp(1.9rem,6vw,3rem)] font-bold tracking-tight uppercase italic leading-none">
              Nuestras Alianzas
            </h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Anterior"
              className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300 shadow-lg ${canScrollLeft ? 'border-zinc-700 bg-zinc-900/90 text-white hover:bg-green-500 hover:text-black hover:border-green-500' : 'border-zinc-800 bg-zinc-950/90 text-zinc-600 opacity-70 cursor-not-allowed'}`}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Siguiente"
              className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300 shadow-lg ${canScrollRight ? 'border-zinc-700 bg-zinc-900/90 text-white hover:bg-green-500 hover:text-black hover:border-green-500' : 'border-zinc-800 bg-zinc-950/90 text-zinc-600 opacity-70 cursor-not-allowed'}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Grid/Carrusel */}
        <div
          ref={scrollRef}
          onScroll={updateCarouselState}
          className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-6"
        >
          {displayData.map((item, idx) => (
            <div
              key={item.id}
              ref={(node) => {
                cardRefs.current[idx] = node;
              }}
              onClick={() => setSelectedSede(item)}
              className="min-w-[230px] max-w-[230px] sm:min-w-[260px] sm:max-w-[260px] md:min-w-[290px] md:max-w-[290px] snap-start group cursor-pointer animate-slide-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="relative aspect-[4/5] max-h-[360px] rounded-xl overflow-hidden mb-3 bg-zinc-900 border border-zinc-800 group-hover:border-green-500/30 transition-all duration-500">
                <img
                  src={item.imagen}
                  alt={item.nombre}
                  className="w-full h-full object-cover opacity-55 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute top-5 left-5">
                  <span className="bg-green-500 text-black font-oswald text-[8px] px-2 py-0.5 font-bold uppercase tracking-widest rounded-sm">
                    {item.tag}
                  </span>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="flex items-center gap-2 mb-2 text-green-500 opacity-80">
                    <MapPin size={10} />
                    <p className="font-oswald text-[9px] tracking-widest uppercase font-semibold">{item.ubicacion}</p>
                  </div>
                  <h3 className="font-oswald text-xl md:text-2xl font-bold uppercase leading-tight tracking-tighter italic group-hover:text-green-500 transition-colors">
                    {item.nombre}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Detalle Compacto */}
      {selectedSede && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedSede(null)} />

          <div className="relative w-full max-w-4xl max-h-[85vh] md:max-h-[70vh] bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl animate-slide-up">

            {/* Botón Cerrar */}
            <button
              onClick={() => setSelectedSede(null)}
              className="absolute top-4 right-4 z-[120] w-8 h-8 bg-black/50 hover:bg-green-500 hover:text-black rounded-full flex items-center justify-center transition-all duration-300 border border-white/10"
            >
              <X size={16} />
            </button>

            {/* Imagen Lateral */}
            <div className="w-full md:w-[45%] h-[200px] md:h-auto relative overflow-hidden shrink-0">
              <img src={selectedSede.imagen} alt={selectedSede.nombre} className="w-full h-full object-cover opacity-95 saturate-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent md:bg-gradient-to-r" />
            </div>

            {/* Contenido */}
            <div className="w-full md:w-[55%] p-6 md:p-8 flex flex-col justify-center bg-zinc-950 overflow-y-auto custom-scrollbar">
              <div className="mb-4">
                <span className="font-oswald text-green-500 text-[9px] tracking-[0.2em] uppercase font-bold px-2 py-1 border border-green-500/20 rounded">
                  {selectedSede.tag}
                </span>
              </div>

              <h2 className="font-oswald text-3xl md:text-4xl font-bold uppercase tracking-tighter leading-none mb-3 italic">
                {selectedSede.nombre}
              </h2>

              <p className="text-zinc-400 font-inter text-xs md:text-sm leading-relaxed mb-6 border-l-2 border-green-500 pl-4 italic">
                {selectedSede.descripcion}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-widest font-bold">
                    <MapPin size={12} className="text-green-500" />
                    <span className="font-oswald text-[9px]">Dirección</span>
                  </div>
                  <p className="font-inter text-[11px] text-zinc-300">{selectedSede.direccion}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-widest font-bold">
                    <Clock size={12} className="text-green-500" />
                    <span className="font-oswald text-[9px]">Horario</span>
                  </div>
                  <p className="font-inter text-[11px] text-zinc-300">{selectedSede.horario} <span className="text-zinc-500">({selectedSede.dias})</span></p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-widest font-bold">
                    <Phone size={12} className="text-green-500" />
                    <span className="font-oswald text-[9px]">Teléfono</span>
                  </div>
                  <p className="font-inter text-[11px] text-zinc-300">{selectedSede.telefono}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-widest font-bold">
                    <Mail size={12} className="text-green-500" />
                    <span className="font-oswald text-[9px]">Email</span>
                  </div>
                  <p className="font-inter text-[11px] text-zinc-300 truncate">{selectedSede.email}</p>
                </div>
              </div>

              {/* Enlaces como Texto Minimalista */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-6 border-t border-zinc-900">
                {selectedSede.instagram && (
                  <div className="flex items-center gap-2 group cursor-pointer">
                    <AtSign size={14} className="text-green-500" />
                    <span className="font-oswald text-[10px] uppercase tracking-[0.15em] text-zinc-400 group-hover:text-white transition-colors">
                      {selectedSede.instagram}
                    </span>
                  </div>
                )}
                {selectedSede.website && (
                  <div className="flex items-center gap-2 group cursor-pointer">
                    <Globe size={14} className="text-green-500" />
                    <span className="font-oswald text-[10px] uppercase tracking-[0.15em] text-zinc-400 group-hover:text-white transition-colors">
                      {selectedSede.website}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
