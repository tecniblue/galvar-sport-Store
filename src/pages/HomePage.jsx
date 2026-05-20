import React, { useContext, useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { GalvarHeroLogo } from "../components/brand";
import { useUIStore, useAuthStore, useCatalogStore, useCartStore } from "../store";

const FightersCarousel = lazy(() => import("../features/home/components/FightersCarousel/FightersCarousel"));
const HowToBuySection = lazy(() => import("../features/home/components/HowToBuySection/HowToBuySection"));
const FeaturedProducts = lazy(() => import("../features/home/components/FeaturedProducts/FeaturedProducts"));
const TechEquipment = lazy(() => import("../features/home/components/TechEquipment"));
const Alianzas = lazy(() => import("../features/home/components/Alianzas"));
const Testimonios = lazy(() => import("../features/home/components/Testimonios"));
const WeeklyOffers = lazy(() => import("../features/home/components/WeeklyOffers/WeeklyOffers"));
const MissionVision = lazy(() => import("../features/home/components/MissionVision"));

const TAGLINE_LEFT = "NO ES ENTRENAR";
const TAGLINE_RIGHT = "ES EVOLUCIONAR";
const TAGLINE_TEXT = `${TAGLINE_LEFT} ${TAGLINE_RIGHT}`;
const TAGLINE_START_DELAY_MS = 1500;
const TAGLINE_CHAR_MS = 34;
const HERO_PULSE_MS = 9000;
const HERO_PULSE_FADE_MS = 650;

const HERO_BACKGROUNDS = [
  "/hero/1.webp",
  "/hero/2.webp",
  "/hero/3.webp",
  "/hero/4.webp",
  "/hero/5.webp",
  "/hero/6.webp",
];

const HERO_SLIDE_MS = 6500;
const HERO_FADE_MS = 900;

const HeroSection = React.memo(() => {
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroFadingNext, setHeroFadingNext] = useState(false);
  const [taglineChars, setTaglineChars] = useState(0);
  const [taglineStarted, setTaglineStarted] = useState(false);
  const [heroPulse, setHeroPulse] = useState(0);
  const [heroPulseHidden, setHeroPulseHidden] = useState(false);
  const nextHeroIndex = (heroIndex + 1) % HERO_BACKGROUNDS.length;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    if (prefersReducedMotion) {
      const id = window.setTimeout(() => {
        setTaglineChars(TAGLINE_TEXT.length);
        setTaglineStarted(true);
      }, 0);
      return () => window.clearTimeout(id);
    }

    let cancelled = false;
    let startTimeoutId;
    let intervalId;
    let resetTimeoutId;

    resetTimeoutId = window.setTimeout(() => {
      if (cancelled) return;
      setTaglineChars(0);
      setTaglineStarted(false);
    }, 0);

    startTimeoutId = window.setTimeout(() => {
      if (cancelled) return;
      setTaglineStarted(true);

      intervalId = window.setInterval(() => {
        setTaglineChars((current) => {
          const next = Math.min(TAGLINE_TEXT.length, current + 1);
          if (next >= TAGLINE_TEXT.length) window.clearInterval(intervalId);
          return next;
        });
      }, TAGLINE_CHAR_MS);
    }, TAGLINE_START_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(resetTimeoutId);
      window.clearTimeout(startTimeoutId);
      window.clearInterval(intervalId);
    };
  }, [heroPulse]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (prefersReducedMotion) return undefined;

    const intervalId = window.setInterval(() => {
      setHeroPulseHidden(true);
      window.setTimeout(() => {
        setHeroPulse((current) => current + 1);
        setHeroPulseHidden(false);
      }, HERO_PULSE_FADE_MS);
    }, HERO_PULSE_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (HERO_BACKGROUNDS.length < 2) return;
    if (typeof window === "undefined") return;

    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (prefersReducedMotion) return;

    let cancelled = false;
    let slideTimeoutId;
    let fadeTimeoutId;

    const scheduleNext = () => {
      slideTimeoutId = window.setTimeout(() => {
        if (cancelled) return;
        setHeroFadingNext(true);

        fadeTimeoutId = window.setTimeout(() => {
          if (cancelled) return;
          setHeroIndex((current) => (current + 1) % HERO_BACKGROUNDS.length);
          setHeroFadingNext(false);
          scheduleNext();
        }, HERO_FADE_MS);
      }, HERO_SLIDE_MS);
    };

    scheduleNext();

    return () => {
      cancelled = true;
      window.clearTimeout(slideTimeoutId);
      window.clearTimeout(fadeTimeoutId);
    };
  }, []);

  const typedLeft = TAGLINE_LEFT.slice(
    0,
    Math.min(taglineChars, TAGLINE_LEFT.length),
  );
  const typedHasSpace = taglineChars > TAGLINE_LEFT.length;
  const typedRight =
    taglineChars > TAGLINE_LEFT.length + 1
      ? TAGLINE_RIGHT.slice(
        0,
        Math.min(
          taglineChars - TAGLINE_LEFT.length - 1,
          TAGLINE_RIGHT.length,
        ),
      )
      : "";
  const showCaret = taglineStarted && taglineChars < TAGLINE_TEXT.length;

  return (
    <header className="min-h-[100svh] flex items-center justify-center relative overflow-hidden pt-20">
      <div className="absolute inset-0">
        <img
          alt=""
          aria-hidden="true"
          src={HERO_BACKGROUNDS[heroIndex]}
          className="absolute inset-0 w-full h-full object-cover object-[50%_30%] sm:object-center hero-bg-zoom pointer-events-none transform-gpu"
          draggable="false"
        />
        <img
          alt=""
          aria-hidden="true"
          src={HERO_BACKGROUNDS[nextHeroIndex]}
          className={`absolute inset-0 w-full h-full object-cover object-[50%_30%] sm:object-center hero-bg-zoom pointer-events-none transform-gpu transition-opacity ease-out ${heroFadingNext ? "opacity-100" : "opacity-0"
            }`}
          style={{ transitionDuration: `${HERO_FADE_MS}ms` }}
          draggable="false"
        />
        <div className="absolute inset-0 bg-black/65" />
      </div>

      <div className="container mx-auto px-6 text-center relative z-10">
        <h1 className="sr-only">Galvar Sport</h1>
        <div
          className={`mb-8 select-none transition-opacity duration-700 ${heroPulseHidden ? "opacity-0" : "opacity-100"
            }`}
        >
          <GalvarHeroLogo />
        </div>
        <p
          className={`text-xs sm:text-sm md:text-base font-black italic uppercase tracking-[0.35em] text-white mb-6 max-w-2xl mx-auto transition-opacity duration-700 ${taglineStarted && !heroPulseHidden ? "opacity-100" : "opacity-0"
            }`}
          aria-label={TAGLINE_TEXT}
        >
          <span className="text-white" aria-hidden="true">
            {typedLeft}
          </span>
          {typedHasSpace ? (
            <span aria-hidden="true"> </span>
          ) : (
            <span aria-hidden="true" className="inline-block w-[0.35em]" />
          )}
          <span
            className="text-green-500 drop-shadow-[0_0_18px_rgba(34,197,94,0.65)]"
            aria-hidden="true"
          >
            {typedRight}
          </span>
          {showCaret ? (
            <span className="galvar-type-caret" aria-hidden="true" />
          ) : null}
        </p>

        <p className="text-[11px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-zinc-300/90 mb-14 max-w-3xl mx-auto leading-relaxed">
          Equipamiento profesional para deportes de contacto, rendimiento y
          protección
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            to="/tienda"
            className="bg-white text-black px-14 py-5 rounded-2xl font-black italic uppercase tracking-widest hover:bg-green-500 transition-all hover:-translate-y-1 shadow-2xl flex items-center justify-center transform-gpu"
          >
            IR A LA TIENDA
          </Link>
          <a
            href="#ubicacion"
            className="glass border border-zinc-800 text-white px-14 py-5 rounded-2xl font-black italic uppercase tracking-widest hover:bg-zinc-900 transition-all flex items-center justify-center gap-2 transform-gpu"
          >
            UBICACIÓN
          </a>
        </div>
      </div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-40"></div>
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(800px,92vw)] h-[min(800px,92vw)] bg-green-500/10 blur-[140px] md:blur-[180px] rounded-full pointer-events-none will-change-transform transform-gpu"></div>
    </header>
  );
});

export default function HomePage() {
  const products = useCatalogStore(state => state.products);
  const fighters = useCatalogStore(state => state.fighters);
  const alliances = useCatalogStore(state => state.alliances);

  const featuredProducts = useMemo(
    () =>
      products
        .filter(
          (p) => p.isFeatured || String(p?.badge ?? "").trim().toUpperCase() === "TOP",
        )
        .sort((a, b) => {
          const ao = a.featuredOrder ?? 9999;
          const bo = b.featuredOrder ?? 9999;
          return ao - bo;
        }),
    [products],
  );

  return (
    <div className="overflow-x-hidden">

      {/* HEADER / HERO */}
      <HeroSection />

      <Suspense fallback={<div className="min-h-screen" />}>
        {/* OFERTAS DE LA SEMANA */}
        <WeeklyOffers />
        {/* ASESORÍA TÉCNICA */}
        <TechEquipment />

        {/* PRODUCTOS DESTACADOS */}
        <FeaturedProducts products={featuredProducts} />

        {/* CÓMO COMPRAR */}
        <HowToBuySection />

        {/* ROSTER DE LUCHADORES */}
        <FightersCarousel fighters={fighters} />

        {/* ALIANZAS */}
        <Alianzas alliances={alliances} />

        {/* TESTIMONIOS */}
        <Testimonios />

        {/* MISIÓN Y VISIÓN */}
        <MissionVision />
      </Suspense>

      {/* UBICACIÓN */}
      <section
        id="ubicacion"
        className="py-24 bg-black border-t border-zinc-900 text-left"
      >
        <div className="container mx-auto px-6">
          <div className="glass rounded-[3.5rem] border border-zinc-900 overflow-hidden grid md:grid-cols-2">
            <div className="p-12 md:p-20 space-y-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 text-white">
                  Nuestra <span className="text-green-500">Casa</span>
                </h2>
                <p className="text-zinc-300 font-bold uppercase tracking-widest text-sm italic mb-2">
                  Clodomiro Rozas 965, Antofagasta
                </p>
                <p className="text-green-500 font-bold text-xs uppercase tracking-wider italic">
                  * Se debe coordinar la visita para poder dar una mejor asesoría
                </p>
              </div>
              <div className="space-y-4 text-xs uppercase font-bold tracking-widest text-zinc-400">
                <div className="flex justify-between border-b border-zinc-900 pb-4 gap-4">
                  <span>Lunes:</span>{" "}
                  <span className="text-white text-right">11:00 - 19:30</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-4 gap-4">
                  <span>Martes a Viernes:</span>{" "}
                  <span className="text-white text-right">11:00 - 15:30 | 16:30 - 19:30</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-4 gap-4">
                  <span>Sábado:</span>{" "}
                  <span className="text-white text-right">11:00 - 16:00</span>
                </div>
                <div className="flex justify-between pt-2 gap-4">
                  <span>Domingo:</span>{" "}
                  <span className="text-green-500 font-black text-right">SOLO CITAS</span>
                </div>
              </div>
              <a
                href="https://maps.app.goo.gl/oACcQ9X4JBLgpqcw8"
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-white text-black px-10 py-5 rounded-2xl font-black italic uppercase tracking-widest hover:bg-green-500 transition-all"
              >
                GOOGLE MAPS
              </a>
            </div>

            <div className="bg-zinc-900 flex flex-col items-center justify-center min-h-[400px] md:min-h-[100%] relative overflow-hidden text-center">
              {/* Google Maps Iframe en el fondo */}
              <iframe
                title="Mapa de Ubicación Galvar Sport"
                src="https://maps.google.com/maps?width=100%25&height=600&hl=es&q=Clodomiro%20Rozas%20965,%20Antofagasta,%20Chile+(Galvar%20Sport)&t=&z=17&ie=UTF8&iwloc=B&output=embed"
                className="absolute inset-0 w-full h-full border-0 z-0"
                style={{ filter: "invert(90%) hue-rotate(180deg) contrast(115%)" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* Capa superpuesta semitransparente para mantener la estética oscura */}
              <div className="absolute inset-0 bg-black/40 pointer-events-none z-10" />

              {/* Elementos decorativos encima del mapa (pointer-events-none para permitir interactuar con el mapa) */}
              <div className="relative z-20 pointer-events-none w-full h-full">
                <MapPin
                  size={72}
                  className="absolute right-6 top-6 md:right-8 md:top-8 text-green-500 animate-bounce drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]"
                />
                <div className="absolute bottom-6 text-[6rem] md:text-[8rem] font-black italic text-white/10 select-none tracking-widest">
                  ANFA
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
