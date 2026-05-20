import React, { useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  Star, StarOff, ArrowUp, ArrowDown,
  Sparkles, Info, GripVertical, Save, CheckCircle2, Loader2,
} from "lucide-react";
import { useUIStore, useAuthStore, useCatalogStore, useCartStore } from "../../../store";
import { updateProduct } from "../../../services/api";

const fmt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("es-CL") : "0";
};

const MAX_FEATURED = 8;

function StockBadge({ stock }) {
  const n = Number(stock) || 0;
  if (n === 0) return <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">Sin stock</span>;
  if (n <= 3)  return <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">Stock bajo ({n})</span>;
  return <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">{n} uds.</span>;
}

/**
 * Rebuilds featuredOrder for the entire products array based on the current
 * visual order of featured items. Non-featured products get null.
 */
function rebuildFeaturedOrders(products, orderedFeaturedIds) {
  const orderMap = new Map(orderedFeaturedIds.map((id, i) => [id, i]));
  return products.map((p) => ({
    ...p,
    featuredOrder: orderMap.has(p.id) ? orderMap.get(p.id) : null,
  }));
}

export default function FeaturedManager({ embedded = false }) {
  const products = useCatalogStore(state => state.products);
  const setProducts = useCatalogStore(state => state.setProducts);
  const showSuccess = useUIStore(state => state.showSuccess);
  const showError = useUIStore(state => state.showError);

  // Local draft order — array of product IDs in current display order
  const [localOrder, setLocalOrder] = useState(null); // null = in sync with context
  const [saved, setSaved] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const saveTimerRef = useRef(null);

  // Featured products sorted by featuredOrder (persisted field)
  // null means unordered — sort to the end
  const featuredFromContext = useMemo(() => {
    return (products ?? [])
      .filter((p) => p.isFeatured)
      .sort((a, b) => {
        const ao = a.featuredOrder ?? 9999;
        const bo = b.featuredOrder ?? 9999;
        return ao - bo;
      });
  }, [products]);

  // Displayed list: use localOrder draft if present, otherwise context order
  const featured = useMemo(() => {
    if (!localOrder) return featuredFromContext;
    const map = new Map((products ?? []).map((p) => [p.id, p]));
    return localOrder.map((id) => map.get(id)).filter(Boolean);
  }, [localOrder, featuredFromContext, products]);

  const isDirty = localOrder !== null;
  const atLimit = featured.length >= MAX_FEATURED;

  // Toggle featured — applies immediately to context (no draft needed)
  const toggle = async (id) => {
    const currentFeatured = [...products]
      .filter((p) => p.isFeatured)
      .sort((a, b) => (a.featuredOrder ?? 9999) - (b.featuredOrder ?? 9999));

    const product = products.find(p => p.id === id);
    if (!product) return;
    const isCurrentlyFeatured = product.isFeatured;

    let newFeaturedIds;
    if (isCurrentlyFeatured) {
      newFeaturedIds = currentFeatured.filter((p) => p.id !== id).map((p) => p.id);
    } else {
      newFeaturedIds = [...currentFeatured.map((p) => p.id), id];
    }
    
    // Calculate new properties for the toggled product
    const next = !product.isFeatured;
    const updatedProduct = {
      ...product,
      isFeatured: next,
      featuredOrder: next ? newFeaturedIds.length - 1 : null,
      badge: next
        ? (product.badge || "TOP")
        : String(product.badge ?? "").trim().toUpperCase() === "TOP"
        ? ""
        : product.badge ?? "",
    };

    try {
      setPendingId(id);
      await updateProduct(id, updatedProduct);
      
      // Update local state
      setLocalOrder(null);
      setSaved(false);
      setProducts((prev) => {
        return prev.map((p) => {
          if (p.id === id) return updatedProduct;
          const idx = newFeaturedIds.indexOf(p.id);
          return idx >= 0 ? { ...p, featuredOrder: idx } : { ...p, featuredOrder: null };
        });
      });
      showSuccess("Destacado actualizado");
    } catch(e) { console.error(e); showError("Error al actualizar destacado"); }
    finally { setPendingId(null); }
  };

  const moveFeatured = (id, dir) => {
    setSaved(false);
    setLocalOrder((prev) => {
      const current = prev ?? featuredFromContext.map((p) => p.id);
      const i = current.indexOf(id);
      if (i < 0) return current;
      if (dir === "up" && i === 0) return current;
      if (dir === "down" && i === current.length - 1) return current;
      const next = [...current];
      const swapIdx = dir === "up" ? i - 1 : i + 1;
      [next[i], next[swapIdx]] = [next[swapIdx], next[i]];
      return next;
    });
  };

  // Save positions — commits local draft to context (persists to DB)
  const savePositions = useCallback(async () => {
    if (!localOrder) return;
    const nextProducts = rebuildFeaturedOrders(products, localOrder);
    
    // We only need to update the products whose featuredOrder has changed.
    const changedProducts = nextProducts.filter(np => {
      const orig = products.find(op => op.id === np.id);
      return orig && orig.featuredOrder !== np.featuredOrder;
    });

    try {
      setIsSavingOrder(true);
      // Execute in parallel
      await Promise.all(changedProducts.map(p => updateProduct(p.id, p)));
      
      setProducts(nextProducts);
      setLocalOrder(null);
      setSaved(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaved(false), 2500);
      showSuccess("Orden guardado");
    } catch(e) { console.error(e); showError("Error guardando orden"); }
    finally { setIsSavingOrder(false); }
  }, [localOrder, setProducts, products, showSuccess, showError]);

  // Drag-and-drop — only updates local draft
  const dragId = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  const handleDragStart = (e, id) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = "move";
    setSaved(false);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== dragId.current) setDragOverId(id);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!dragId.current || dragId.current === targetId) {
      setDragOverId(null);
      return;
    }
    const sourceId = dragId.current;
    setLocalOrder((prev) => {
      const current = prev ?? featuredFromContext.map((p) => p.id);
      const fromIdx = current.indexOf(sourceId);
      const toIdx   = current.indexOf(targetId);
      if (fromIdx < 0 || toIdx < 0) return current;
      const next = [...current];
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, sourceId);
      return next;
    });
    dragId.current = null;
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    dragId.current = null;
    setDragOverId(null);
  };

  return (
    <div className="space-y-6">

      {/* Header — standalone mode */}
      {!embedded && (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Panel de control</p>
            <h2 className="text-2xl font-black italic uppercase text-white">
              Productos <span className="text-green-500">Destacados</span>
            </h2>
            <p className="text-[10px] font-bold text-zinc-500 mt-1">
              Estos productos aparecen en la sección Featured del Home. Máximo {MAX_FEATURED}.
            </p>
          </div>
          <div className={`glass rounded-2xl border px-5 py-3 text-center ${atLimit ? "border-amber-500/40 bg-amber-500/5" : "border-green-500/20 bg-green-500/5"}`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">En home</p>
            <p className={`text-3xl font-black tabular-nums ${atLimit ? "text-amber-400" : "text-green-400"}`}>
              {featured.length}<span className="text-zinc-600 text-lg">/{MAX_FEATURED}</span>
            </p>
          </div>
        </div>
      )}

      {/* Compact header — embedded inside Inventory panel */}
      {embedded && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Destacados en Home</p>
            <p className="text-[10px] font-bold text-zinc-500 mt-0.5">
              Estos productos aparecen en la sección Featured. Máx. {MAX_FEATURED}.
            </p>
          </div>
          <div className={`glass rounded-2xl border px-4 py-2 text-center shrink-0 ${atLimit ? "border-amber-500/40 bg-amber-500/5" : "border-green-500/20 bg-green-500/5"}`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">En home</p>
            <p className={`text-xl font-black tabular-nums ${atLimit ? "text-amber-400" : "text-green-400"}`}>
              {featured.length}<span className="text-zinc-600 text-base">/{MAX_FEATURED}</span>
            </p>
          </div>
        </div>
      )}

      {/* Featured list */}
      <div className="glass rounded-[2rem] border border-zinc-800 overflow-hidden">
        {/* List header with save button */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
          <Sparkles size={14} className="text-green-500" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white">
            Actualmente en el Home
          </p>

          <div className="ml-auto flex items-center gap-3">
            {/* Pending changes hint */}
            {isDirty && !saved && (
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest animate-pulse">
                Cambios sin guardar
              </span>
            )}
            {/* Saved confirmation */}
            {saved && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-green-400 uppercase tracking-widest">
                <CheckCircle2 size={11} /> Guardado
              </span>
            )}
            {/* Save button — only shows when there are pending changes */}
            <button
              type="button"
              onClick={savePositions}
              disabled={!isDirty || isSavingOrder}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                isDirty
                  ? "bg-green-500 border-green-400 text-black hover:bg-white hover:border-white shadow-lg shadow-green-500/20"
                  : "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-40"
              }`}
              title="Guardar orden actual"
            >
              {isSavingOrder ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
              {isSavingOrder ? "Guardando..." : "Guardar posiciones"}
            </button>
          </div>
        </div>

        {/* Drag hint */}
        {featured.length > 1 && (
          <div className="px-6 py-2 border-b border-zinc-900/50 bg-zinc-950/30">
            <p className="text-[9px] font-bold text-zinc-600">
              ⠿ Arrastra las filas o usa ↑↓ para reordenar — luego presiona <span className="text-zinc-500">Guardar posiciones</span>
            </p>
          </div>
        )}

        {featured.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center opacity-50 gap-3">
            <StarOff size={32} className="text-zinc-700" />
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-600">
              Ningún producto destacado
            </p>
            <p className="text-[10px] font-bold text-zinc-700">
              Marca productos como destacados desde la vista de Productos
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {featured.map((p, idx) => (
              <div
                key={p.id}
                draggable
                onDragStart={(e) => handleDragStart(e, p.id)}
                onDragOver={(e) => handleDragOver(e, p.id)}
                onDrop={(e) => handleDrop(e, p.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 px-5 py-3 transition-all select-none ${
                  dragOverId === p.id
                    ? "bg-green-500/10 border-l-2 border-green-500"
                    : "hover:bg-zinc-900/30"
                }`}
              >
                {/* Drag handle */}
                <div className="cursor-grab active:cursor-grabbing text-zinc-700 hover:text-zinc-400 transition-colors shrink-0">
                  <GripVertical size={14} />
                </div>

                {/* Position badge */}
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isDirty ? "bg-amber-500/10 border border-amber-500/20" : "bg-green-500/10 border border-green-500/20"
                }`}>
                  <span className={`text-[9px] font-black ${isDirty ? "text-amber-400" : "text-green-500"}`}>
                    {idx + 1}
                  </span>
                </div>

                {/* Image */}
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    : <span className="text-[9px] font-black text-zinc-600">{p.label || "GS"}</span>}
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-black uppercase text-white truncate">{p.name}</span>
                    {p.sku && <span className="text-[9px] font-bold text-green-500 uppercase">#{p.sku}</span>}
                    {p.badge && p.badge !== "TOP" && (
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400">{p.badge}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-black text-zinc-400 tabular-nums">${fmt(p.price)}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase">{p.cat}</span>
                    <StockBadge stock={p.stock} />
                  </div>
                </div>

                {/* Reorder + remove */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveFeatured(p.id, "up")}
                    disabled={idx === 0}
                    className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    title="Subir"
                  >
                    <ArrowUp size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFeatured(p.id, "down")}
                    disabled={idx === featured.length - 1}
                    className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    title="Bajar"
                  >
                    <ArrowDown size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    disabled={pendingId === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-all text-[9px] font-black uppercase tracking-widest ml-1"
                    title="Quitar del Home"
                  >
                    {pendingId === p.id ? <Loader2 size={10} className="animate-spin" /> : <StarOff size={10} />}
                    {pendingId === p.id ? "Quitando" : "Quitar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Limit warning */}
      {atLimit && (
        <div className="flex items-center gap-3 glass rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-3">
          <Info size={14} className="text-amber-400 shrink-0" />
          <p className="text-[11px] font-bold text-amber-300">
            Límite alcanzado ({MAX_FEATURED} productos). Quita uno antes de agregar otro.
          </p>
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-3 opacity-60">
        <Info size={12} className="text-zinc-500 mt-0.5 shrink-0" />
        <p className="text-[10px] font-bold text-zinc-600">
          Para agregar o quitar productos del Home, usa el botón{" "}
          <strong className="text-zinc-400">★ TOP</strong> en la vista de{" "}
          <strong className="text-zinc-400">Productos</strong>.
        </p>
      </div>
    </div>
  );
}
