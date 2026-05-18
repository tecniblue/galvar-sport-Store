import React, { useContext, useMemo, useState, useCallback } from "react";
import { useUIStore, useAuthStore, useCatalogStore, useCartStore } from "../store";
import { Search, Filter } from "lucide-react";
import { ProductCard, ProductDetailsModal } from "../components/product";

const formatCLP = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString("es-CL") : "0";
};

export default function StorePage() {
  const products = useCatalogStore(state => state.products);
  const categories = useCatalogStore(state => state.categories);
  const addToCart = useCartStore(state => state.addToCart);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Todos");
  const [activeSubcat, setActiveSubcat] = useState("Todos");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const searchText = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      if (product.active === false) return false;
      const name = String(product?.name ?? "").toLowerCase();
      const sku = String(product?.sku ?? "").toLowerCase();
      const matchesSearch = !searchText || name.includes(searchText) || sku.includes(searchText);
      const matchesCat = activeCat === "Todos" || product.cat === activeCat;
      const matchesSubcat = activeSubcat === "Todos" || product.subcat === activeSubcat;
      return matchesSearch && matchesCat && matchesSubcat;
    });
    return result;
  }, [activeCat, activeSubcat, products, searchText]);

  const handleAddToCart = useCallback((cardProduct) => {
    const original = products.find(p => p.id === cardProduct.id);
    if (original) addToCart(original);
  }, [addToCart, products]);

  const handleViewDetails = useCallback((cardProduct) => {
    const original = products.find(p => p.id === cardProduct.id);
    if (original) setSelectedProduct(original);
  }, [products]);

  const handleCloseModal = useCallback(() => setSelectedProduct(null), []);

  const activeCatObj = useMemo(
    () => categories.find(c => c.name === activeCat) ?? null,
    [categories, activeCat]
  );

  const subcategories = activeCatObj?.subcategories ?? [];
  const hasSubcats = subcategories.length > 0;

  const hasCatalog = products.length > 0;
  const hasFilters = Boolean(searchText) || activeCat !== "Todos" || activeSubcat !== "Todos";

  const handleSelectCat = (catName) => {
    setActiveCat(catName);
    setActiveSubcat("Todos");
  };

  return (
    <div className="pt-28 sm:pt-32 md:pt-36 container mx-auto px-4 sm:px-6 pb-20 md:pb-24">
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 md:gap-10 mb-10 md:mb-16 text-left">
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
            Tienda <br />
            <span className="text-green-500">Oficial</span>
          </h1>
          <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold italic">
            Inventario disponible en Antofagasta
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-96 group">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-green-500 transition-colors"
            size={18}
          />
          <input
            type="text"
            id="store-search"
            aria-label="Buscar productos por nombre o SKU"
            placeholder="BUSCAR SKU O NOMBRE..."
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl py-4 pl-14 pr-6 text-xs font-bold text-white outline-none focus:border-green-500 focus:bg-zinc-900 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* ── Category & Subcategory Filters ── */}
      <div className="mb-10 md:mb-14 space-y-4">

        {/* Level 1 — Disciplines */}
        <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
          {categories.map((catObj) => {
            const catName = catObj?.name ?? catObj;
            const isActive = activeCat === catName;
            return (
              <button
                key={catName}
                type="button"
                id={`cat-${catName.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => handleSelectCat(catName)}
                className={`
                  relative flex-shrink-0 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest
                  transition-all duration-200 ease-out whitespace-nowrap border
                  ${isActive
                    ? "bg-green-500 border-green-500 text-black shadow-[0_0_16px_rgba(34,197,94,0.35)]"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  }
                `}
              >
                {catName}
                {isActive && hasSubcats && (
                  <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-black/20 text-[9px] font-black">
                    {subcategories.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Level 2 — Subcategories */}
        {activeCat !== "Todos" && hasSubcats && (
          <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1 pl-1 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-1 mr-2 flex-shrink-0">
              <Filter size={11} className="text-zinc-600" />
              <span className="text-[9px] uppercase font-black text-zinc-600 tracking-widest">Tipo</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubcat("Todos")}
              className={`
                flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest
                transition-all duration-200 border whitespace-nowrap
                ${activeSubcat === "Todos"
                  ? "bg-zinc-100 border-zinc-100 text-black"
                  : "bg-transparent border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                }
              `}
            >
              Todos
            </button>
            {subcategories.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setActiveSubcat(sub)}
                className={`
                  flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest
                  transition-all duration-200 border whitespace-nowrap
                  ${activeSubcat === sub
                    ? "bg-zinc-100 border-zinc-100 text-black"
                    : "bg-transparent border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                  }
                `}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Active filter summary */}
        {hasFilters && (
          <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-zinc-500 tracking-widest pl-1">
            <span>{filtered.length} {filtered.length === 1 ? "producto" : "productos"}</span>
            {(activeCat !== "Todos" || activeSubcat !== "Todos") && (
              <button
                type="button"
                onClick={() => { handleSelectCat("Todos"); }}
                className="text-zinc-600 hover:text-red-400 transition-colors underline underline-offset-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Product Grid ── */}
      {filtered.length === 0 ? (
        <div className="py-16 md:py-20 text-center glass rounded-[3rem] border border-zinc-900 px-8">
          <p className="text-2xl font-black uppercase tracking-[0.22em] text-white">
            {hasCatalog
              ? hasFilters
                ? "No encontramos coincidencias"
                : "No hay productos disponibles"
              : "Tu catálogo está vacío"}
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.28em] text-zinc-500 font-bold max-w-2xl mx-auto">
            {hasCatalog
              ? "Prueba con otra categoría o ajusta tu búsqueda."
              : "Agrega productos desde el panel admin para publicarlos en la tienda."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                category: product.cat,
                specialty: product.variant,
                price: `$${formatCLP(product.price)}`,
                image: product.images?.[0] || "",
              }}
              variant="store"
              onAddToCart={handleAddToCart}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      <ProductDetailsModal
        key={selectedProduct?.id ?? "no-product"}
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={handleCloseModal}
        onAddToCart={
          selectedProduct
            ? (product, size) => {
                addToCart(selectedProduct, size);
                handleCloseModal();
              }
            : undefined
        }
      />
    </div>
  );
}
