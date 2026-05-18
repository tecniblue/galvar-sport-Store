import React, { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import { useUIStore, useAuthStore, useCatalogStore, useCartStore } from "../../../store";

export default function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const cart = useCartStore(state => state.cart);
  const setCart = useCartStore(state => state.setCart);

  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);
  const prevFocusRef = useRef(null);

  const formatCLP = useCallback((value) => {
    const num = typeof value === "number" ? value : Number(value);
    return (Number.isFinite(num) ? num : 0).toLocaleString("es-CL");
  }, []);

  const total = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = Number(item?.effectivePrice ?? item?.price) || 0;
      const qty = Number(item?.qty) || 0;
      return acc + price * qty;
    }, 0);
  }, [cart]);

  const itemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item?.qty) || 0), 0);
  }, [cart]);

  const cartIsEmpty = cart.length === 0;

  const updateQty = useCallback(
    (id, size, delta) => {
      setCart((prev) =>
        prev
          .map((item) => {
            if (item.id !== id || item.size !== size) return item;
            const currentQty = Number(item.qty) || 0;
            let maxStock = Number(item.stock) || 0;
            if (size) {
              const sInfo = (item.stockBySize || item.stock_by_size || {})[size];
              if (sInfo) {
                maxStock = Number(sInfo.stock) || 0;
              }
            }
            const nextQty = Math.max(0, Math.min(currentQty + delta, maxStock));
            if (currentQty + delta > maxStock) {
              useUIStore.getState().showNotification(`Solo quedan ${maxStock} unidades disponibles`);
            }
            return { ...item, qty: nextQty };
          })
          .filter((item) => (Number(item.qty) || 0) > 0),
      );
    },
    [setCart],
  );

  const removeItem = useCallback(
    (id, size) => setCart((prev) => prev.filter((item) => !(item.id === id && item.size === size))),
    [setCart],
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    prevFocusRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusId = window.setTimeout(() => {
      closeBtnRef.current?.focus?.();
    }, 0);

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;

      const root = drawerRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusId);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      const prev = prevFocusRef.current;
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [isOpen, onClose]);

  const goToCheckout = () => {
    if (cartIsEmpty) return;
    onClose?.();
    navigate("/checkout");
  };

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] transition-opacity duration-500 ease-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        aria-labelledby="cart-drawer-title"
        className={`fixed right-0 top-0 h-[100dvh] w-full max-w-[440px] bg-[#09090b] z-[101] border-l border-white/5 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Header */}
        <header className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-xl sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-300">
              <ShoppingBag size={16} strokeWidth={2.5} />
            </div>
            <h2 id="cart-drawer-title" className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Tu Pedido
              {!cartIsEmpty && (
                <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-black">
                  {itemCount}
                </span>
              )}
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto custom-scrollbar relative">
          {cartIsEmpty ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-700 mb-6">
                <ShoppingBag size={32} strokeWidth={1.5} />
              </div>
              <p className="text-lg font-bold text-white mb-2">Tu carrito está vacío</p>
              <p className="text-sm text-zinc-500 max-w-[240px]">
                Explora nuestra tienda y añade los productos que necesitas para entrenar.
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-2">
              {cart.map((item) => {
                const unitPrice = Number(item?.effectivePrice ?? item?.price) || 0;
                const qty = Number(item?.qty) || 0;
                const lineTotal = unitPrice * qty;

                return (
                  <div
                    key={`${item.id}-${item.size || "default"}`}
                    className="group relative flex gap-5 p-3 rounded-2xl hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Image */}
                    <div className="w-20 h-24 bg-zinc-900 rounded-xl overflow-hidden shrink-0 border border-white/5 relative">
                      {item.images && item.images[0] ? (
                        <img
                          src={item.images[0]}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          alt={item.name ? `Imagen de ${item.name}` : "Producto"}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black italic text-zinc-700 text-[10px] bg-zinc-900">
                          {item.label || "GS"}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-grow py-1 justify-between min-w-0">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white leading-tight truncate">
                            {item.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {item.variant && (
                              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                                {item.variant}
                              </span>
                            )}
                            {item.variant && item.size && <span className="w-1 h-1 rounded-full bg-zinc-800" />}
                            {item.size && (
                              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                                Talla: <span className="text-white">{item.size}</span>
                              </span>
                            )}
                            {item.isWeeklyOffer && (
                              <span className="text-[8px] font-black bg-yellow-500 text-black px-1.5 py-0.5 rounded leading-none">
                                OFERTA
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeItem(item.id, item.size)}
                          className="text-zinc-600 hover:text-red-400 p-1.5 -mr-1.5 transition-colors"
                          aria-label="Eliminar producto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex justify-between items-end mt-4">
                        {/* Unified Quantity Pill */}
                        <div className="flex items-center bg-black rounded-lg border border-white/10 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, item.size, -1)}
                            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                            aria-label="Disminuir cantidad"
                          >
                            <Minus size={12} strokeWidth={2.5} />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-white tabular-nums">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, item.size, 1)}
                            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus size={12} strokeWidth={2.5} />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-green-400 tabular-nums leading-none">
                            ${formatCLP(lineTotal)}
                          </p>
                          {qty > 1 && (
                            <p className="text-[9px] font-medium text-zinc-600 mt-1">
                              ${formatCLP(unitPrice)} c/u
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!cartIsEmpty && (
          <footer className="p-6 border-t border-white/5 bg-black/60 backdrop-blur-2xl shrink-0">
            <div className="flex justify-between items-baseline mb-6 px-1">
              <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Subtotal</span>
              <span className="text-2xl font-black text-white tabular-nums">${formatCLP(total)}</span>
            </div>

            <button
              type="button"
              onClick={goToCheckout}
              className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-green-400 transition-all active:scale-[0.98] shadow-lg shadow-white/5"
            >
              Iniciar Pago
            </button>
            <p className="text-[9px] text-zinc-500 text-center mt-4 font-bold uppercase tracking-widest">
              El envío se coordinará en el siguiente paso.
            </p>
          </footer>
        )}
      </aside>
    </>
  );
}
