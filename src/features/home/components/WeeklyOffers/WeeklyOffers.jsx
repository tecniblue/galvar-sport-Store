import React, { useContext, useMemo, useState, useEffect } from "react";
import { Zap, Timer, ChevronRight, ShoppingCart } from "lucide-react";
import { AppContext } from "../../../../context/AppContext";
import { ProductCard, ProductDetailsModal } from "../../../../components/product";
import "./WeeklyOffers.css";

const Countdown = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0
  });

  useEffect(() => {
    if (!endDate) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(endDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!endDate) return null;

  return (
    <div className="weekly-offers__countdown">
      <Timer size={16} className="text-yellow-400" />
      <div className="weekly-offers__timer-grid">
        <div className="weekly-offers__timer-unit">
          <span>{String(timeLeft.days).padStart(2, '0')}</span>
          <small>D</small>
        </div>
        <div className="weekly-offers__timer-sep">:</div>
        <div className="weekly-offers__timer-unit">
          <span>{String(timeLeft.hours).padStart(2, '0')}</span>
          <small>H</small>
        </div>
        <div className="weekly-offers__timer-sep">:</div>
        <div className="weekly-offers__timer-unit">
          <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
          <small>M</small>
        </div>
        <div className="weekly-offers__timer-sep">:</div>
        <div className="weekly-offers__timer-unit">
          <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
          <small>S</small>
        </div>
      </div>
    </div>
  );
};

export default function WeeklyOffers() {
  const { products, addToCart } = useContext(AppContext);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const offers = useMemo(() => {
    return products
      .filter(p => p.isWeeklyOffer && p.active)
      .sort((a, b) => (a.offerOrder || 0) - (b.offerOrder || 0));
  }, [products]);

  // Find the earliest end date among active offers
  const earliestEndDate = useMemo(() => {
    const dates = offers
      .map(o => o.offerEndDate)
      .filter(Boolean)
      .sort();
    return dates[0] || null;
  }, [offers]);

  if (offers.length === 0) return null;

  return (
    <section className="weekly-offers">
      <div className="container mx-auto px-6">
        <div className="weekly-offers__card glass border border-zinc-900 rounded-[3rem] overflow-hidden">
          
          <div className="grid lg:grid-cols-12">
            
            {/* Banner Side */}
            <div className="lg:col-span-4 p-8 sm:p-12 md:p-16 flex flex-col justify-between bg-gradient-to-br from-yellow-500/10 to-transparent relative">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                  <Zap size={14} />
                  Flash Sale
                </div>
                
                <h2 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter leading-[0.9] text-white mb-6">
                  Ofertas de <br />
                  <span className="text-yellow-400">la Semana</span>
                </h2>
                
                <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs">
                  Equipamiento de alto rendimiento con descuentos exclusivos por tiempo limitado.
                </p>

                <Countdown endDate={earliestEndDate} />
              </div>

              <div className="mt-12 relative z-10">
                <button className="group flex items-center gap-4 text-white font-black italic uppercase tracking-widest text-xs hover:text-yellow-400 transition-colors">
                  Ver todas las promociones
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-yellow-400/40 transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </button>
              </div>
            </div>

            {/* Products Side */}
            <div className="lg:col-span-8 p-6 sm:p-10 md:p-12 bg-zinc-950/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {offers.slice(0, 3).map((product) => (
                  <ProductCard 
                    key={product.id}
                    product={{
                        ...product,
                        category: product.cat,
                        specialty: product.variant,
                        image: product.images?.[0] ?? "",
                        price: `$${Number(product.price || 0).toLocaleString("es-CL")}`
                    }}
                    variant="store"
                    onAddToCart={(p) => addToCart(product)}
                    onViewDetails={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <ProductDetailsModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, size) => addToCart(p, size)}
      />
    </section>
  );
}
