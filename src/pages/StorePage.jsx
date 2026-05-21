import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useCatalogStore, useCartStore } from "../store";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, ProductDetailsModal } from "../components/product";
import { SkeletonBlock } from "../components/ui";
import { SEO, SITE_URL } from "../components/seo";

const formatCLP = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString("es-CL") : "0";
};

const PRODUCTS_PER_PAGE = 20;

export default function StorePage() {
  const products = useCatalogStore(state => state.products);
  const categories = useCatalogStore(state => state.categories);
  const addToCart = useCartStore(state => state.addToCart);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Todos");
  const [activeSubcat, setActiveSubcat] = useState("Todos");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const searchText = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      if (product.active === false) return false;
      const name = String(product?.name ?? "").toLowerCase();
      const category = String(product?.cat ?? "").toLowerCase();
      const variant = String(product?.variant ?? "").toLowerCase();
      const matchesSearch = !searchText || name.includes(searchText) || category.includes(searchText) || variant.includes(searchText);
      const matchesCat = activeCat === "Todos" || product.cat === activeCat;
      const matchesSubcat = activeSubcat === "Todos" || product.subcat === activeSubcat;
      return matchesSearch && matchesCat && matchesSubcat;
    });
    return result;
  }, [activeCat, activeSubcat, products, searchText]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCat, activeSubcat, searchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const paginationStartIndex = (activePage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = filtered.slice(
    paginationStartIndex,
    paginationStartIndex + PRODUCTS_PER_PAGE
  );
  const showingStart = filtered.length === 0 ? 0 : paginationStartIndex + 1;
  const showingEnd = Math.min(paginationStartIndex + paginatedProducts.length, filtered.length);
  const shouldShowPagination = filtered.length > PRODUCTS_PER_PAGE;
  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages]
  );

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
  const storeSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Tienda oficial Galvar Sport",
      url: `${SITE_URL}/tienda`,
      description:
        "Catalogo de equipamiento deportivo profesional para deportes de contacto, entrenamiento y proteccion, disponible en Antofagasta con envios a Chile.",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: filtered.slice(0, 12).map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Product",
            name: product.name,
            category: product.cat,
            image: product.images?.[0] ? new URL(product.images[0], SITE_URL).toString() : undefined,
            offers: {
              "@type": "Offer",
              priceCurrency: "CLP",
              price: String(product.price ?? ""),
              availability:
                product.active === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
              seller: {
                "@type": "SportingGoodsStore",
                name: "Galvar Sport",
              },
            },
          },
        })),
      },
    }),
    [filtered],
  );

  const handleSelectCat = (catName) => {
    setActiveCat(catName);
    setActiveSubcat("Todos");
  };

  const handleSelectPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage === activePage) return;
    setCurrentPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="pt-28 sm:pt-32 md:pt-36 container mx-auto px-4 sm:px-6 pb-20 md:pb-24">
      <SEO
        title="Tienda oficial de equipamiento deportivo"
        description="Compra guantes, protecciones, ropa y accesorios para deportes de contacto. Catalogo Galvar Sport disponible en Antofagasta con envios a todo Chile."
        path="/tienda"
        jsonLd={storeSchema}
      />

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
            aria-label="Buscar productos por nombre, categoría o diseño"
            placeholder="BUSCAR PRODUCTO..."
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
      {!hasCatalog && !hasFilters ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-4">
              <SkeletonBlock className="aspect-[4/5]" />
              <SkeletonBlock className="h-5" />
              <SkeletonBlock className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {paginatedProducts.map((product) => (
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

          {shouldShowPagination && (
            <nav
              className="mt-12 md:mt-16 flex flex-col items-center gap-4"
              aria-label="Paginación de productos"
            >
              <p className="text-center text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                Mostrando {showingStart}-{showingEnd} de {filtered.length} productos
              </p>

              <div className="w-full overflow-x-auto no-scrollbar pb-1">
                <div className="mx-auto flex w-max items-end justify-center gap-2 px-2">
                  <div className="flex w-16 flex-shrink-0 justify-end">
                    <button
                      type="button"
                      onClick={() => handleSelectPage(activePage - 1)}
                      disabled={activePage === 1}
                      className="group flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-colors hover:text-green-400 focus:outline-none focus:text-green-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-zinc-400"
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-full border border-transparent transition-all group-hover:border-green-500/40 group-hover:bg-green-500/10 group-focus:border-green-500/40 group-focus:bg-green-500/10">
                        <ChevronLeft size={18} />
                      </span>
                      <span>Anterior</span>
                    </button>
                  </div>

                  {pageNumbers.map((page) => {
                    const isActivePage = activePage === page;
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => handleSelectPage(page)}
                        aria-current={isActivePage ? "page" : undefined}
                        aria-label={`Página ${page}`}
                        className={`
                          flex h-14 w-10 flex-shrink-0 flex-col items-center justify-end gap-2 text-sm font-black transition-colors focus:outline-none
                          ${isActivePage
                            ? "text-green-400"
                            : "text-zinc-500 hover:text-zinc-200 focus:text-zinc-200"
                          }
                        `}
                      >
                        <span
                          className={`
                            grid h-9 w-9 place-items-center rounded-full border transition-all
                            ${isActivePage
                              ? "border-green-500 bg-green-500 text-black shadow-[0_0_18px_rgba(34,197,94,0.35)]"
                              : "border-transparent bg-transparent hover:border-zinc-700 hover:bg-zinc-900"
                            }
                          `}
                        >
                          {page}
                        </span>
                        <span
                          className={`
                            h-1 w-6 rounded-full transition-all
                            ${isActivePage ? "bg-green-500" : "bg-transparent"}
                          `}
                        />
                      </button>
                    );
                  })}

                  <div className="flex w-16 flex-shrink-0 justify-start">
                    <button
                      type="button"
                      onClick={() => handleSelectPage(activePage + 1)}
                      disabled={activePage === totalPages}
                      className="group flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-colors hover:text-green-400 focus:outline-none focus:text-green-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-zinc-400"
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-full border border-transparent transition-all group-hover:border-green-500/40 group-hover:bg-green-500/10 group-focus:border-green-500/40 group-focus:bg-green-500/10">
                        <ChevronRight size={18} />
                      </span>
                      <span>Siguiente</span>
                    </button>
                  </div>
                </div>
              </div>
            </nav>
          )}
        </>
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
