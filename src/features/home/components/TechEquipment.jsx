import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Shield,
  Box,
  Swords,
  Trophy,
  Dumbbell,
  Trophy as SportsIcon,
  Activity,
  Target,
  Zap,
  Medal,
} from "lucide-react";

const CATEGORIES = [
  {
    id: "box",
    label: "BOX",
    icon: Box,
    description: "Guantes y protectores",
    detail:
      "Revisamos onzaje, ajuste y absorcion para que entrenes con seguridad y respuesta real en golpeo.",
  },
  {
    id: "mma",
    label: "MMA",
    icon: Swords,
    description: "Guantillas y espinilleras",
    detail:
      "Productos pensados para clinch, grappling y striking, con materiales que soportan sesiones mixtas.",
  },
  {
    id: "kickboxing",
    label: "KICKBOX",
    icon: Zap,
    description: "Espinilleras y guantes",
    detail:
      "Equipamiento especializado para la dinamica de golpes y patadas, ofreciendo proteccion y movilidad.",
  },
  {
    id: "jiujitsu",
    label: "BJJ",
    icon: Shield,
    description: "Kimonos y rashguards",
    detail:
      "Material resistente a desgarros y friccion, diseñado para soportar exigentes entrenamientos de suelo.",
  },
  {
    id: "judo",
    label: "JUDO",
    icon: Medal,
    description: "Judogis y cinturones",
    detail:
      "Prendas de alto gramaje y resistencia para soportar los agarres y proyecciones mas exigentes.",
  },
  {
    id: "karate",
    label: "KARATE",
    icon: Target,
    description: "Karategis y protecciones",
    detail:
      "Ligereza y movilidad para kumite y precision para kata, manteniendo la tradicion y el rendimiento.",
  },
  {
    id: "entrenamiento",
    label: "TRAIN",
    icon: Dumbbell,
    description: "Manoplas, sacos y mas",
    detail:
      "Accesorios para volumen de trabajo, coordinacion y potencia, recomendados segun tu rutina.",
  },
  {
    id: "multideporte",
    label: "MULTI",
    icon: SportsIcon,
    description: "Futbol, voley y otros",
    detail:
      "Soluciones para clubes y academias que necesitan equipamiento durable y facil de mantener.",
  },
];

export default function TechEquipment() {
  const [activeCategory, setActiveCategory] = useState("entrenamiento");

  const activeCategoryData = useMemo(() => {
    return (
      CATEGORIES.find((category) => category.id === activeCategory) ?? CATEGORIES[0]
    );
  }, [activeCategory]);

  const ActiveIcon = activeCategoryData.icon;

  return (
    <section
      id="experiencia"
      className="min-h-screen bg-black text-white py-20 px-6 md:px-12 lg:px-24 flex items-center overflow-hidden relative border-t border-zinc-900 text-left"
    >
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-green-500/5 to-transparent pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-start lg:items-center">
        <div className="space-y-10 relative z-10">
          <div className="space-y-2">
            <h2 className="text-6xl md:text-7xl font-black italic uppercase leading-[0.9] tracking-tighter">
              Equipo <br />
              <span className="text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                Tecnico
              </span>
            </h2>
            <div className="h-1.5 w-24 bg-gradient-to-r from-green-500 to-transparent rounded-full mt-4" />
          </div>

          <div className="space-y-6">
            <p className="text-zinc-300 text-xl md:text-2xl leading-relaxed font-medium italic">
              Donde el rendimiento se encuentra con la precision.
            </p>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-lg border-l-2 border-green-500/30 pl-6 italic">
              Te ayudamos a elegir mejor. Desde el onzaje correcto para deportes
              de contacto hasta implementos para academias y entrenamiento funcional.
            </p>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <li className="flex items-center gap-4 group">
              <div className="bg-green-500/20 p-2.5 rounded-xl group-hover:bg-green-500 transition-all duration-300 shrink-0">
                <CheckCircle2 className="text-green-500 group-hover:text-black" size={24} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-zinc-200 leading-tight">
                Estandares de <br /> Competicion
              </span>
            </li>
            <li className="flex items-center gap-4 group">
              <div className="bg-green-500/20 p-2.5 rounded-xl group-hover:bg-green-500 transition-all duration-300 shrink-0">
                <CheckCircle2 className="text-green-500 group-hover:text-black" size={24} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-zinc-200 leading-tight">
                Seleccion por <br /> Disciplina
              </span>
            </li>
          </ul>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-green-500 text-black">
                <ActiveIcon size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-green-500">
                  Categoria activa
                </p>
                <h3 className="text-2xl font-black italic uppercase text-white">
                  {activeCategoryData.label}
                </h3>
              </div>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {activeCategoryData.detail}
            </p>
          </div>

          <div className="pt-4">
            <Link
              to="/tienda"
              className="inline-flex items-center gap-3 bg-green-500 text-black px-8 py-4 rounded-2xl font-black uppercase italic tracking-widest hover:bg-white transition-all transform hover:-translate-y-1 active:scale-95 shadow-lg shadow-green-500/30"
            >
              <Shield size={20} />
              Ver catalogo
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 relative">
          {CATEGORIES.map((category) => {
            const CategoryIcon = category.icon;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`relative h-24 md:h-28 rounded-2xl p-3 md:p-4 cursor-pointer overflow-hidden transition-all duration-500 group text-left ${
                  activeCategory === category.id
                    ? "bg-green-500 text-black scale-[1.02] shadow-xl shadow-green-500/30"
                    : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800 border border-zinc-800"
                }`}
              >
                <div
                  className={`absolute -right-3 -bottom-3 opacity-10 transition-transform duration-700 group-hover:scale-110 ${
                    activeCategory === category.id ? "text-black" : "text-white"
                  }`}
                >
                  <CategoryIcon size={70} />
                </div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div
                    className={
                      activeCategory === category.id
                        ? "text-black/40"
                        : "text-green-500/30"
                    }
                  >
                    <CategoryIcon size={18} />
                  </div>

                  <div>
                    <h3 className="text-lg md:text-xl font-black italic leading-none mb-1">
                      {category.label}
                    </h3>
                    <p
                      className={`text-[8px] md:text-[9px] font-bold uppercase tracking-wide leading-tight line-clamp-2 ${
                        activeCategory === category.id ? "text-black/60" : "text-zinc-500"
                      }`}
                    >
                      {category.description}
                    </p>
                  </div>
                </div>

                {activeCategory === category.id ? (
                  <div className="absolute top-6 right-6">
                    <div className="bg-black text-green-500 p-1.5 rounded-full">
                      <Trophy size={16} />
                    </div>
                  </div>
                ) : null}
              </button>
            );
          })}

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-black border-4 border-zinc-900 rounded-full z-20 hidden md:flex items-center justify-center shadow-2xl">
            <span className="text-green-500 font-black text-xs italic tracking-tighter">
              PRO
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
