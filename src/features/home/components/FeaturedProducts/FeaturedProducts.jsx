import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard, ProductDetailsModal } from '../../../../components/product';
import './FeaturedProducts.css';
import { AppContext } from '../../../../context/AppContext';

const DEFAULT_PRODUCTS = [

];

const toCLPNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value ?? '');
  const digitsOnly = raw.replace(/[^\d]/g, '');
  const num = Number(digitsOnly);
  return Number.isFinite(num) ? num : 0;
};

const toDetailsProduct = (product) => {
  if (!product) return null;

  const images =
    Array.isArray(product.images) ? product.images :
      product.image ? [product.image] :
        [];

  const name = product.name ?? '';
  const label = product.label ?? (String(name).trim().slice(0, 2).toUpperCase() || 'GS');

  return {
    ...product,
    id: product.id ?? name,
    name,
    cat: product.cat ?? product.category ?? '',
    variant: product.variant ?? product.specialty ?? '',
    sku: product.sku ?? '',
    desc: product.desc ?? product.description ?? '',
    label,
    images,
    price: typeof product.price === 'number' ? product.price : toCLPNumber(product.price),
  };
};

const toCardProduct = (product) => {
  const details = toDetailsProduct(product);
  if (!details) return product;

  return {
    ...details,
    category: details.cat,
    specialty: details.variant,
    image: details.images?.[0] ?? "",
    price: `$${Number(details.price || 0).toLocaleString("es-CL")}`,
  };
};

export default function FeaturedProducts({
  products = DEFAULT_PRODUCTS,
  autoPlayMs = 5000,
  onAddToCart,
  title = 'Equipamiento',
  highlight = 'PRO',
  subtitle = 'DESTACADOS',
}) {
  const app = useContext(AppContext);
  const addToCartFromContext = app?.addToCart;
  const handleAddToCart = onAddToCart ?? ((p, size) => addToCartFromContext?.(toDetailsProduct(p), size));
  const displayProducts = useMemo(() => products?.length ? products : DEFAULT_PRODUCTS, [products]);

  const mappedProducts = useMemo(() => {
    return displayProducts.map(product => {
      const details = toDetailsProduct(product);
      const cardProduct = toCardProduct(product);
      return { original: product, details, cardProduct };
    });
  }, [displayProducts]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(3);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const pointerStartX = useRef(null);
  const pointerId = useRef(null);

  const handleViewDetails = useCallback((cardProduct) => {
    const matched = displayProducts.find(p => (p.id ?? p.name) === cardProduct.id);
    if (matched) setSelectedProduct(toDetailsProduct(matched));
  }, [displayProducts]);

  const productCount = displayProducts?.length ?? 0;
  const maxIndex = Math.max(0, productCount - slidesPerView);
  const canNavigate = productCount > slidesPerView;

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mqDesktop = window.matchMedia?.('(min-width: 1024px)');
    const mqTablet = window.matchMedia?.('(min-width: 768px)');

    const compute = () => {
      if (mqDesktop?.matches) return 3;
      if (mqTablet?.matches) return 2;
      return 1;
    };

    const update = () => setSlidesPerView(compute());

    update();
    mqDesktop?.addEventListener?.('change', update);
    mqTablet?.addEventListener?.('change', update);

    return () => {
      mqDesktop?.removeEventListener?.('change', update);
      mqTablet?.removeEventListener?.('change', update);
    };
  }, []);

  const goTo = useCallback((idx) => {
    if (!productCount) return;
    const clamped = Math.min(maxIndex, Math.max(0, idx));
    setActiveIndex(clamped);
  }, [maxIndex, productCount]);

  const goNext = useCallback(() => {
    if (!productCount) return;
    setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex, productCount]);

  const goPrev = useCallback(() => {
    if (!productCount) return;
    setActiveIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex, productCount]);

  const shouldAutoPlay = canNavigate && isAutoPlayEnabled && !isHoverPaused && !prefersReducedMotion;

  useEffect(() => {
    if (!shouldAutoPlay) return undefined;

    const id = window.setInterval(goNext, autoPlayMs);
    return () => window.clearInterval(id);
  }, [autoPlayMs, goNext, shouldAutoPlay]);

  useEffect(() => {
    if (!productCount) return undefined;
    if (activeIndex <= maxIndex) return undefined;

    const id = window.setTimeout(() => {
      setActiveIndex(maxIndex);
    }, 0);

    return () => window.clearTimeout(id);
  }, [activeIndex, maxIndex, productCount]);

  const onKeyDown = (event) => {
    if (!canNavigate) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setIsAutoPlayEnabled(false);
      goPrev();
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setIsAutoPlayEnabled(false);
      goNext();
    }
  };

  const onPointerDown = (event) => {
    if (!canNavigate) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('button,a,input,select,textarea')) return;
    pointerId.current = event.pointerId;
    pointerStartX.current = event.clientX;
    setIsAutoPlayEnabled(false);
  };

  const onPointerUp = (event) => {
    if (!canNavigate) return;
    if (pointerId.current !== event.pointerId) return;

    const startX = pointerStartX.current;
    pointerId.current = null;
    pointerStartX.current = null;
    if (startX == null) return;

    const deltaX = event.clientX - startX;
    const threshold = 50;
    if (Math.abs(deltaX) < threshold) return;

    if (deltaX < 0) goNext();
    else goPrev();
  };

  const translatePct = slidesPerView ? (100 / slidesPerView) : 100;

  return (
    <section className="featured-products">
      <div className="featured-products__container">
        <header className="featured-products__header">
          <div>
            <span className="featured-products__subtitle">{subtitle}</span>
            <h2 className="featured-products__title">
              {title} <span className="featured-products__highlight">{highlight}</span>
            </h2>
          </div>

          <div className="featured-products__nav" aria-label="Navegación de destacados">
            <button
              type="button"
              onClick={() => {
                setIsAutoPlayEnabled(false);
                goPrev();
              }}
              className="featured-products__nav-btn"
              aria-label="Anterior"
              disabled={!canNavigate}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAutoPlayEnabled(false);
                goNext();
              }}
              className="featured-products__nav-btn"
              aria-label="Siguiente"
              disabled={!canNavigate}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="featured-products__carousel-wrapper">
          <div
            className="featured-products__carousel"
            role="region"
            aria-roledescription="carousel"
            aria-label="Carrusel de productos destacados"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onMouseEnter={() => setIsHoverPaused(true)}
            onMouseLeave={() => setIsHoverPaused(false)}
            onFocusCapture={() => setIsHoverPaused(true)}
            onBlurCapture={(event) => {
              if (event.currentTarget.contains(event.relatedTarget)) return;
              setIsHoverPaused(false);
            }}
          >
            <div
              className="featured-products__carousel-track"
              style={{
                transform: `translateX(-${activeIndex * translatePct}%)`,
                '--fp-slides': String(slidesPerView),
              }}
            >
              {mappedProducts.map(({ original, details, cardProduct }) => {
                return (
                  <div
                    key={original.id ?? original.name}
                    className="featured-products__carousel-item"
                  >
                    <ProductCard
                      product={cardProduct}
                      variant="featured"
                      onAddToCart={handleAddToCart}
                      onViewDetails={handleViewDetails}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="featured-products__indicators" aria-label="Indicadores del carrusel">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`featured-products__indicator${idx === activeIndex ? ' featured-products__indicator--active' : ''
                }`}
              aria-label={`Ir a la página ${idx + 1}`}
              aria-current={idx === activeIndex ? 'true' : undefined}
              onClick={() => {
                setIsAutoPlayEnabled(false);
                goTo(idx);
              }}
              disabled={!canNavigate}
            />
          ))}
        </div>
      </div>

      <ProductDetailsModal
        key={selectedProduct?.id ?? "featured-empty-product"}
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, size) => handleAddToCart(p, size)}
      />
    </section>
  );
}
