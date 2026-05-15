import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Palette,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ProductDetailsModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) {
  const [imgIndex, setImgIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);

  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];

  const images = Array.isArray(product?.images) ? product.images : [];
  const hasImages = images.length > 0;
  const stock = Number(product?.stock);
  const isOutOfStock = Number.isFinite(stock) && stock <= 0;
  const displayIndex = hasImages
    ? ((imgIndex % images.length) + images.length) % images.length
    : 0;

  const priceInfo = useMemo(() => {
    const original = Number(product?.price);
    const offer = Number(product?.offerPrice);
    const isOffer = product?.isWeeklyOffer && offer > 0;
    
    return {
      original: Number.isFinite(original) ? original.toLocaleString("es-CL") : "0",
      offer: Number.isFinite(offer) ? offer.toLocaleString("es-CL") : "0",
      isOffer
    };
  }, [product]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setSelectedSize(null); // Reset size on open

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") setImgIndex((current) => current - 1);
      if (event.key === "ArrowRight") setImgIndex((current) => current + 1);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-details-title"
    >
      <div className="min-h-full flex items-center justify-center p-4 py-12 md:p-10">
        <div
          className="bg-zinc-950 border border-zinc-800 w-full max-w-5xl rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 md:top-6 md:right-6 z-20 p-3 bg-black/50 hover:bg-zinc-900 rounded-full text-white transition-all backdrop-blur-sm"
            aria-label="Cerrar detalles del producto"
          >
            <X size={20} />
          </button>

          <div className="w-full md:w-1/2 bg-black flex flex-col relative aspect-[4/3] md:aspect-auto md:min-h-[500px]">
            <div className="flex-grow flex items-center justify-center overflow-hidden relative">
              {hasImages ? (
                <>
                  <img
                    src={images[displayIndex]}
                    className="w-full h-full object-cover"
                    alt={product.name}
                  />
                  {images.length > 1 ? (
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                      <button
                        type="button"
                        onClick={() => setImgIndex((current) => current - 1)}
                        className="p-2 bg-black/40 hover:bg-green-500 rounded-full text-white pointer-events-auto transition-all backdrop-blur-sm"
                        aria-label="Imagen anterior"
                      >
                        <ChevronLeft />
                      </button>
                      <button
                        type="button"
                        onClick={() => setImgIndex((current) => current + 1)}
                        className="p-2 bg-black/40 hover:bg-green-500 rounded-full text-white pointer-events-auto transition-all backdrop-blur-sm"
                        aria-label="Imagen siguiente"
                      >
                        <ChevronRight />
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <span className="text-[5rem] sm:text-[8rem] md:text-[10rem] font-black italic text-zinc-900 select-none uppercase">
                  {product.label || "GS"}
                </span>
              )}
            </div>

            {hasImages && images.length > 1 ? (
              <div className="h-16 md:h-20 bg-zinc-900/50 flex gap-2 p-2 overflow-x-auto no-scrollbar border-t border-zinc-800">
                {images.map((img, index) => (
                  <button
                    key={img + index}
                    type="button"
                    onClick={() => setImgIndex(index)}
                    className={`w-12 md:w-16 h-full flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      index === displayIndex
                        ? "border-green-500"
                        : "border-transparent opacity-50"
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col text-left">
            <div className="flex justify-between items-start mb-4 md:mb-6 gap-4">
              <div>
                <span className="text-[9px] font-black text-green-500 uppercase tracking-[0.3em] border border-green-500/20 px-3 py-1 rounded-full mb-3 inline-block">
                  {product.cat}
                </span>
                <h2
                  id="product-details-title"
                  className="text-2xl sm:text-3xl md:text-4xl font-black italic uppercase leading-none text-white tracking-tighter"
                >
                  {product.name}
                </h2>
              </div>
              <div className="flex flex-col items-end gap-2">
                {product.sku ? (
                  <span className="text-[10px] font-black text-zinc-600 tracking-widest uppercase">
                    # {product.sku}
                  </span>
                ) : null}
                {product.isWeeklyOffer && product.offerLabel && (
                  <span className="text-[10px] font-black bg-red-500 text-white px-2 py-1 rounded-md animate-pulse">
                    {product.offerLabel}
                  </span>
                )}
              </div>
            </div>

            {product.variant ? (
              <div className="flex items-center gap-2 mb-6 md:mb-8">
                <Palette size={16} className="text-green-500" />
                <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                  {product.variant}
                </span>
              </div>
            ) : null}

            <p className="text-zinc-400 text-sm md:text-sm leading-relaxed uppercase font-medium mb-8 md:mb-12 flex-grow overflow-y-auto custom-scrollbar pr-2 md:pr-4 whitespace-pre-line">
              {product.desc || "Sin descripcion disponible."}
            </p>

            {sizes.length > 0 && (
              <div className="mb-8">
                <span className="text-xs font-black uppercase text-zinc-500 tracking-widest mb-3 block">
                  Selecciona tu talla / onza
                </span>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                        selectedSize === size
                          ? "bg-green-500 border-green-400 text-black shadow-lg shadow-green-500/20"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-green-500/50 hover:text-green-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 pt-6 md:pt-8 border-t border-zinc-900">
              <div className="space-y-1 w-full sm:w-auto text-center sm:text-left">
                {priceInfo.isOffer ? (
                  <div className="flex flex-col">
                    <span className="text-3xl md:text-4xl font-black text-yellow-400">${priceInfo.offer}</span>
                    <span className="text-sm font-bold text-zinc-500 line-through">${priceInfo.original}</span>
                  </div>
                ) : (
                  <span className="text-3xl md:text-4xl font-black text-white">${priceInfo.original}</span>
                )}
                {Number.isFinite(stock) ? (
                  <p className="text-[11px] uppercase tracking-widest font-bold text-zinc-500">
                    {isOutOfStock ? "Sin stock" : `${stock} unidades disponibles`}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isOutOfStock) return;
                  if (sizes.length > 0 && !selectedSize) {
                    alert("Por favor selecciona una talla antes de añadir al pedido.");
                    return;
                  }
                  onAddToCart(product, selectedSize);
                  onClose();
                }}
                disabled={isOutOfStock}
                className={`w-full py-4 md:py-5 rounded-2xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
                  isOutOfStock
                    ? "bg-zinc-800 text-zinc-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-400 text-black"
                }`}
              >
                {isOutOfStock ? "Sin stock" : "Anadir al pedido"}{" "}
                <ShoppingBag size={20} className="fill-current" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
