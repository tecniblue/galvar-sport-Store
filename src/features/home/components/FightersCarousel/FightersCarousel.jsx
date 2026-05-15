import React, { useCallback, useEffect, useRef, useState } from "react";
import "./FightersCarousel.css";

const AUTOPLAY_MS = 7000;
const RESUME_AUTOPLAY_MS = 12000;

const FIGHTERS = [


];

const WEIGHT_LABELS = {
  STRAWWEIGHT: "PESO PAJA",
  FLYWEIGHT: "PESO MOSCA",
  BANTAMWEIGHT: "PESO GALLO",
  FEATHERWEIGHT: "PESO PLUMA",
  LIGHTWEIGHT: "PESO LIGERO",
  WELTERWEIGHT: "PESO WELTER",
  MIDDLEWEIGHT: "PESO MEDIO",
  LIGHT_HEAVYWEIGHT: "SEMIPESADO",
  HEAVYWEIGHT: "PESO PESADO",
};

const formatRecord = (record) => {
  if (!record) return "";
  return record
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" - ");
};

const getInstagramUrl = (handle) => {
  const cleaned = String(handle ?? "").trim().replace(/^@/, "");
  return cleaned ? `https://instagram.com/${cleaned}` : null;
};

export default function FightersCarousel({ fighters }) {
  const displayFighters = fighters && fighters.length > 0 ? fighters : FIGHTERS;
  const rosterRef = useRef(null);
  const progressBarRef = useRef(null);
  const cardRefs = useRef([]);
  const activeIndexRef = useRef(0);
  const scrollFrameRef = useRef(0);
  const releaseProgrammaticScrollRef = useRef(null);
  const resumeAutoplayTimeoutRef = useRef(null);
  const isProgrammaticScrollRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(displayFighters.length > 1);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isTemporarilyPaused, setIsTemporarilyPaused] = useState(false);

  const fightersCount = displayFighters.length;
  const isAutoplayEnabled =
    fightersCount > 1 && !isHovering && !isFocusWithin && !isTemporarilyPaused;

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const updateProgress = useCallback(() => {
    const scroller = rosterRef.current;
    const progressBar = progressBarRef.current;
    if (!scroller || !progressBar) return;

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    const progress =
      maxScrollLeft <= 0
        ? 1
        : Math.min(1, Math.max(0, scroller.scrollLeft / maxScrollLeft));

    progressBar.style.transform = `scaleX(${progress})`;
  }, []);

  const cardLayoutsRef = useRef([]);

  const updateCarouselState = useCallback(() => {
    const scroller = rosterRef.current;
    if (!scroller) return;

    const cards = cardRefs.current.filter(Boolean);
    if (!cards.length) return;

    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      let cardCenter;
      if (cardLayoutsRef.current[index] !== undefined) {
        cardCenter = cardLayoutsRef.current[index];
      } else {
        cardCenter = card.offsetLeft + card.offsetWidth / 2;
        cardLayoutsRef.current[index] = cardCenter;
      }

      const distance = Math.abs(cardCenter - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveIndex(nearestIndex);
    setCanScrollPrev(nearestIndex > 0);
    setCanScrollNext(nearestIndex < fightersCount - 1);
    updateProgress();
  }, [fightersCount, updateProgress]);

  const pauseAutoplayTemporarily = useCallback((delayMs = RESUME_AUTOPLAY_MS) => {
    window.clearTimeout(resumeAutoplayTimeoutRef.current);
    setIsTemporarilyPaused(true);

    if (typeof delayMs === "number") {
      resumeAutoplayTimeoutRef.current = window.setTimeout(() => {
        setIsTemporarilyPaused(false);
      }, delayMs);
    }
  }, []);

  const scrollToIndex = useCallback(
    (nextIndex, behavior = "smooth") => {
      const scroller = rosterRef.current;
      const targetCard = cardRefs.current[nextIndex];
      if (!scroller || !targetCard) return;

      isProgrammaticScrollRef.current = true;
      window.clearTimeout(releaseProgrammaticScrollRef.current);

      const targetLeft =
        targetCard.offsetLeft - (scroller.clientWidth - targetCard.offsetWidth) / 2;

      scroller.scrollTo({
        left: Math.max(0, targetLeft),
        behavior,
      });

      setActiveIndex(nextIndex);
      setCanScrollPrev(nextIndex > 0);
      setCanScrollNext(nextIndex < fightersCount - 1);

      releaseProgrammaticScrollRef.current = window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, behavior === "smooth" ? 700 : 0);
    },
    [fightersCount],
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const scroller = rosterRef.current;
    if (!scroller) return undefined;

    const handleScroll = () => {
      if (!isProgrammaticScrollRef.current) {
        pauseAutoplayTemporarily();
      }

      if (scrollFrameRef.current) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = 0;
        updateCarouselState();
      });
    };

    const handleResize = () => {
      cardLayoutsRef.current = [];
      updateCarouselState();
      scrollToIndex(activeIndexRef.current, "auto");
    };

    const initFrameId = window.requestAnimationFrame(() => {
      scrollToIndex(0, "auto");
      updateCarouselState();
    });

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(initFrameId);
      window.clearTimeout(releaseProgrammaticScrollRef.current);
      window.clearTimeout(resumeAutoplayTimeoutRef.current);
      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, [pauseAutoplayTemporarily, scrollToIndex, updateCarouselState]);

  useEffect(() => {
    if (!isAutoplayEnabled) return undefined;

    const timeoutId = window.setTimeout(() => {
      const nextIndex = activeIndex >= fightersCount - 1 ? 0 : activeIndex + 1;
      scrollToIndex(nextIndex, "smooth");
    }, AUTOPLAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeIndex, fightersCount, isAutoplayEnabled, scrollToIndex]);

  const handleMove = (direction) => {
    pauseAutoplayTemporarily();
    const nextIndex = Math.min(
      fightersCount - 1,
      Math.max(0, activeIndex + direction),
    );
    if (nextIndex === activeIndex) return;
    scrollToIndex(nextIndex, "smooth");
  };

  return (
    <section className="fighters-section">
      <div className="container mx-auto px-6">
        <div className="fighters-header">
          <div>
            <div className="fighters-label">Guerreros De La Marca</div>
            <h2 className="fighters-title">Galvar Elite</h2>
          </div>

          <div className="fighters-nav">
            <button
              type="button"
              onClick={() => handleMove(-1)}
              aria-label="Anterior"
              aria-controls="fighters-carousel"
              disabled={!canScrollPrev}
              className="fighters-btn fighters-btn--prev"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleMove(1)}
              aria-label="Siguiente"
              aria-controls="fighters-carousel"
              disabled={!canScrollNext}
              className="fighters-btn fighters-btn--next"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="fighters-carousel-wrap">
          <div
            ref={rosterRef}
            className="fighters-carousel"
            id="fighters-carousel"
            role="region"
            aria-roledescription="carousel"
            aria-label="Carrusel de luchadores"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                handleMove(-1);
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                handleMove(1);
              }
            }}
            onPointerDown={() => pauseAutoplayTemporarily()}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onFocus={() => setIsFocusWithin(true)}
            onBlur={(event) => {
              if (event.currentTarget.contains(event.relatedTarget)) return;
              setIsFocusWithin(false);
            }}
          >
            {displayFighters.map((fighter, index) => {
              const instagramUrl = getInstagramUrl(fighter.handle);

              return (
                <article
                  key={fighter.id}
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                  className={`fighter-card${index === activeIndex ? " fighter-card--active" : ""
                    }`}
                  aria-label={`${fighter.name}, ${fighter.specialty}`}
                >
                  <div className="fighter-card__media">
                    <img
                      src={fighter.image}
                      alt={fighter.name}
                      className="fighter-card__image"
                      loading="lazy"
                      draggable="false"
                    />
                    <div className="fighter-card__media-overlay" aria-hidden="true" />
                    <div className="fighter-card__sport-tag" aria-hidden="true">
                      {fighter.specialty}
                    </div>
                  </div>

                  <div className="fighter-card__body">
                    <div className="fighter-card__meta">
                      <div className="fighter-card__weight">
                        {WEIGHT_LABELS[fighter.weight] ?? fighter.weight}
                      </div>
                      <div className="fighter-card__level">{fighter.level ?? "AMATEUR"}</div>
                    </div>

                    <h3 className="fighter-card__name">{fighter.name}</h3>

                    {instagramUrl ? (
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="fighter-card__social"
                        aria-label={`Instagram de ${fighter.name}`}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                          className="fighter-card__social-icon"
                        >
                          <path
                            d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M17.5 6.5h.01"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="fighter-card__social-handle">
                          {fighter.handle ?? ""}
                        </span>
                      </a>
                    ) : null}

                    <div className="fighter-card__record">
                      <div className="fighter-card__record-label">RECORD</div>
                      <div className="fighter-card__record-value">
                        {formatRecord(fighter.record)}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="fighters-footer">
          <div className="fighters-progress" aria-hidden="true">
            <span ref={progressBarRef} className="fighters-progress__bar" />
          </div>

          <div className="fighters-dots" aria-label="Seleccionar luchador">
            {displayFighters.map((fighter, index) => (
              <button
                key={fighter.id}
                type="button"
                onClick={() => {
                  pauseAutoplayTemporarily();
                  scrollToIndex(index, "smooth");
                }}
                className={`fighters-dot${index === activeIndex ? " fighters-dot--active" : ""
                  }`}
                aria-label={`Ir a ${fighter.name}`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
