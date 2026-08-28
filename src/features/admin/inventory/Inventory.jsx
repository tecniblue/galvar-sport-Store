import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Package, Plus, Trash2, Search, Edit3, Star, EyeOff, Eye, AlertTriangle, TrendingDown, CheckCircle2, Minus, Sparkles, Loader2 } from "lucide-react";
import { useUIStore, useCatalogStore, useCartStore } from "../../../store";
import ProductModal from "./ProductModal";
import { SimpleModal } from "../../../components/ui";
import FeaturedManager from "../featured/FeaturedManager";
import { updateProduct, deleteProduct as apiDeleteProduct, createCategory, updateCategory, deleteCategory as apiDeleteCategory } from '../../../services/api';

// Stock status helper
const stockStatus = (s) => {
  const n = Number(s) || 0;
  if (n === 0) return { label: "Sin stock", color: "text-red-400 border-red-500/30 bg-red-500/10", dot: "bg-red-500", icon: AlertTriangle };
  if (n <= 3)  return { label: "Stock bajo",  color: "text-amber-400 border-amber-500/30 bg-amber-500/10", dot: "bg-amber-400", icon: TrendingDown };
  return { label: "En stock",   color: "text-green-400 border-green-500/30 bg-green-500/10",  dot: "bg-green-400", icon: CheckCircle2 };
};

const EMPTY_LIST = [];
const normalizeProductId = (id) => String(id ?? "").trim();
const NOOP = () => {};
const CATEGORY_SEARCH_ALL = "";
const PRODUCTS_PER_PAGE = 12;

const syncFeaturedProduct = (product, nextFeatured, currentProducts) => {
  // Find the current max featuredOrder among featured items to append at the end
  const maxOrder = currentProducts
    ? currentProducts
        .filter((p) => p.isFeatured && p.id !== product.id)
        .reduce((max, p) => (p.featuredOrder != null && p.featuredOrder > max ? p.featuredOrder : max), -1)
    : -1;

  return {
    ...product,
    isFeatured: nextFeatured,
    featuredOrder: nextFeatured ? maxOrder + 1 : null,
    badge:
      nextFeatured
        ? "TOP"
        : String(product?.badge ?? "").trim().toUpperCase() === "TOP"
          ? ""
          : product?.badge ?? "",
  };
};

export default function Inventory() {
  const app = {
    products: useCatalogStore(s => s.products),
    setProducts: useCatalogStore(s => s.setProducts),
    categories: useCatalogStore(s => s.categories),
    customCategories: useCatalogStore(s => s.customCategories),
    setCategories: useCatalogStore(s => s.setCategories),
    fighters: useCatalogStore(s => s.fighters),
    alliances: useCatalogStore(s => s.alliances),
    cart: useCartStore(s => s.cart)
  };
  const products = app?.products ?? EMPTY_LIST;
  const setProducts = app?.setProducts ?? NOOP;
  const categories = app?.categories ?? EMPTY_LIST;       // includes "Todos"
  const customCategories = app?.customCategories ?? EMPTY_LIST; // without "Todos"
  const setCategories = app?.setCategories ?? NOOP;       // operates on customCategories
  const showSuccess = useUIStore(state => state.showSuccess);
  const showError = useUIStore(state => state.showError);

  const [activeCategory, setActiveCategory] = useState(null);
  const [categorySearch, setCategorySearch] = useState(CATEGORY_SEARCH_ALL);
  const [productSearch, setProductSearch] = useState("");
  const [inventoryView, setInventoryView] = useState("products"); // "products" | "featured"
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [renameCategoryValue, setRenameCategoryValue] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [moveTargetCategory, setMoveTargetCategory] = useState("");
  const [editingStockId, setEditingStockId] = useState(null);
  const [stockDraft, setStockDraft] = useState("");
  const [pendingActionId, setPendingActionId] = useState(null);
  const [subcatDraft, setSubcatDraft] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const editingCategoryObj = useMemo(
    () => customCategories.find(c => c?.name === editingCategory) ?? null,
    [customCategories, editingCategory]
  );

  const selectedCategory =
    activeCategory && categories.some((c) => c.name === activeCategory)
      ? activeCategory
      : "Todos";

  const categoriesList = useMemo(
    () => [
      { name: "Todos" },
      ...categories.filter((category) => category?.name && category.name !== "Todos")
    ],
    [categories]
  );

  const managedCategories = useMemo(
    () => categories.filter((category) => category?.name && category.name !== "Todos"),
    [categories],
  );

  const filteredCategories = useMemo(() => {
    const needle = categorySearch.trim().toLowerCase();
    if (!needle) return categoriesList;
    return categoriesList.filter((category) =>
      category.name.toLowerCase().includes(needle),
    );
  }, [categorySearch, categoriesList]);

  const productsByActiveCategory = useMemo(() => {
    let list = products;
    if (selectedCategory && selectedCategory !== "Todos") {
      list = list.filter((p) => p.cat === selectedCategory);
    }
    const q = productSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(q);
        const skuMatch = p.sku?.toLowerCase().includes(q);
        const catMatch = p.cat?.toLowerCase().includes(q);
        const variantMatch = p.variant?.toLowerCase().includes(q);
        const descMatch = p.desc?.toLowerCase().includes(q);
        const sizesMatch = p.sizes && p.sizes.some(s => s.toLowerCase().includes(q));
        return nameMatch || skuMatch || catMatch || variantMatch || descMatch || sizesMatch;
      });
    }
    return list;
  }, [products, selectedCategory, productSearch]);

  const totalProductPages = Math.max(1, Math.ceil(productsByActiveCategory.length / PRODUCTS_PER_PAGE));
  const paginationStartIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = productsByActiveCategory.slice(
    paginationStartIndex,
    paginationStartIndex + PRODUCTS_PER_PAGE,
  );
  const showingStart = productsByActiveCategory.length ? paginationStartIndex + 1 : 0;
  const showingEnd = Math.min(paginationStartIndex + paginatedProducts.length, productsByActiveCategory.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, productSearch, inventoryView]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalProductPages));
  }, [totalProductPages]);

  // KPI stats
  const kpis = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.active !== false).length,
    lowStock: products.filter(p => Number(p.stock) <= 3).length,
    featured: products.filter(p => p.isFeatured).length,
  }), [products]);

  const adjustStock = useCallback(async (id, delta) => {
    const productId = normalizeProductId(id);
    if (!productId) return;
    const product = products.find(p => normalizeProductId(p.id) === productId);
    if (!product) return;
    const newStock = Math.max(0, (Number(product.stock) || 0) + delta);
    
    try {
      setPendingActionId(`stock:${productId}`);
      await updateProduct(productId, { ...product, id: productId, stock: newStock });
      setProducts(prev => prev.map(p =>
        normalizeProductId(p.id) === productId ? { ...p, id: productId, stock: newStock } : p
      ));
      showSuccess("Stock actualizado");
    } catch (e) {
      console.error(e);
      showError("Error al actualizar stock");
    } finally {
      setPendingActionId(null);
    }
  }, [setProducts, products, showSuccess, showError]);

  const commitStockEdit = useCallback(async (id) => {
    const productId = normalizeProductId(id);
    if (!productId) {
      setEditingStockId(null);
      setStockDraft("");
      return;
    }
    const n = parseInt(stockDraft, 10);
    if (!isNaN(n) && n >= 0) {
      const product = products.find(p => normalizeProductId(p.id) === productId);
      if (product) {
        try {
          setPendingActionId(`stock:${productId}`);
          await updateProduct(productId, { ...product, id: productId, stock: n });
          setProducts(prev => prev.map(p => normalizeProductId(p.id) === productId ? { ...p, id: productId, stock: n } : p));
          showSuccess("Stock actualizado");
        } catch (e) {
           console.error(e);
           showError("Error al actualizar stock");
        } finally {
          setPendingActionId(null);
        }
      }
    }
    setEditingStockId(null);
    setStockDraft("");
  }, [stockDraft, setProducts, products, showSuccess, showError]);

  const deleteCategoryCandidates = useMemo(
    () => managedCategories.filter((category) => category.name !== categoryToDelete),
    [categoryToDelete, managedCategories],
  );

  const productsInDeleteCategory = useMemo(
    () =>
      categoryToDelete
        ? products.filter((product) => product.cat === categoryToDelete)
        : [],
    [categoryToDelete, products],
  );

  const handleOpenNew = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const deleteProduct = async (product) => {
    const productId = normalizeProductId(product?.id);
    if (!productId) {
      alert("No se puede eliminar un producto sin ID. Refresca el admin e intentalo de nuevo.");
      return;
    }
    if (!window.confirm("Seguro que quieres eliminar este producto?")) return;
    try {
      setPendingActionId(`delete:${productId}`);
      await apiDeleteProduct(productId, product);
      const sku = String(product?.sku ?? "").trim().toLowerCase();
      const name = String(product?.name ?? "").trim().toLowerCase();
      const cat = String(product?.cat ?? "").trim().toLowerCase();
      setProducts((prev) => prev.filter((item) => {
        if (normalizeProductId(item.id) === productId) return false;
        if (sku && String(item.sku ?? "").trim().toLowerCase() === sku) return false;
        return !(!sku && name && cat && String(item.name ?? "").trim().toLowerCase() === name && String(item.cat ?? "").trim().toLowerCase() === cat);
      }));
      showSuccess("Producto eliminado");
    } catch(e) { console.error(e); showError("Error al eliminar"); }
    finally { setPendingActionId(null); }
  };

  const toggleProductActive = async (id) => {
    const productId = normalizeProductId(id);
    if (!productId) return;
    const p = products.find(prod => normalizeProductId(prod.id) === productId);
    if(!p) return;
    try {
      setPendingActionId(`active:${productId}`);
      await updateProduct(productId, { ...p, id: productId, active: !(p.active !== false) });
      setProducts((prev) =>
        prev.map((product) =>
          normalizeProductId(product.id) === productId ? { ...product, id: productId, active: !(product.active !== false) } : product
        )
      );
      showSuccess("Producto actualizado");
    } catch(e) { console.error(e); showError("Error al actualizar"); }
    finally { setPendingActionId(null); }
  };

  const toggleProductFeatured = async (id) => {
    const productId = normalizeProductId(id);
    if (!productId) return;
    const p = products.find(prod => normalizeProductId(prod.id) === productId);
    if(!p) return;
    try {
      setPendingActionId(`featured:${productId}`);
      const updatedP = syncFeaturedProduct({ ...p, id: productId }, !p.isFeatured, products);
      await updateProduct(productId, updatedP);
      setProducts((prev) =>
        prev.map((product) => normalizeProductId(product.id) === productId ? updatedP : product)
      );
      showSuccess("Destacado actualizado");
    } catch(e) { console.error(e); showError("Error al actualizar destacado"); }
    finally { setPendingActionId(null); }
  };

  const handleCreateCategory = async () => {
    const cleaned = newCategory.trim();
    if (!cleaned) {
      setCategoryError("Ingresa un nombre de categoria.");
      return;
    }

    const alreadyExists = managedCategories.some(
      (category) => category.name.toLowerCase() === cleaned.toLowerCase(),
    );
    if (alreadyExists) {
      setCategoryError("La categoria ya existe.");
      return;
    }

    try {
      setPendingActionId("category:create");
      await createCategory({ name: cleaned, subcategories: [] });
      setCategories((prev) => [...prev, { name: cleaned, subcategories: [] }]);
      setActiveCategory(cleaned);
      setNewCategory("");
      setCategoryError("");
      showSuccess("Categoria creada");
    } catch (e) { console.error(e); setCategoryError("Error al crear"); showError("Error al crear categoria"); }
    finally { setPendingActionId(null); }
  };

  const openRenameCategory = (category) => {
    const name = typeof category === 'string' ? category : category.name;
    setEditingCategory(name);
    setRenameCategoryValue(name);
    setCategoryError("");
  };

  const handleRenameCategory = async () => {
    const cleaned = renameCategoryValue.trim();
    if (!editingCategory) return;

    if (!cleaned) {
      setCategoryError("Ingresa un nombre de categoria.");
      return;
    }

    const alreadyExists = managedCategories.some(
      (category) =>
        category.name !== editingCategory &&
        category.name.toLowerCase() === cleaned.toLowerCase(),
    );
    if (alreadyExists) {
      setCategoryError("La categoria ya existe.");
      return;
    }

    try {
      setPendingActionId("category:rename");
      await updateCategory(editingCategory, { newName: cleaned, subcategories: editingCategoryObj?.subcategories || [] });
      setCategories((prev) =>
        prev.map((category) => (category.name === editingCategory ? { ...category, name: cleaned } : category)),
      );
      setProducts((prev) =>
        prev.map((product) =>
          product.cat === editingCategory ? { ...product, cat: cleaned } : product,
        ),
      );
      if (activeCategory === editingCategory) {
        setActiveCategory(cleaned);
      }
      setEditingCategory(null);
      setRenameCategoryValue("");
      setCategoryError("");
      setSubcatDraft("");
      showSuccess("Categoria actualizada");
    } catch (e) {
      console.error(e); setCategoryError("Error");
      showError("Error al renombrar categoria");
    } finally {
      setPendingActionId(null);
    }
  };

  const handleAddSubcat = async () => {
    const val = subcatDraft.trim();
    if (!val || !editingCategoryObj) return;
    if (!(editingCategoryObj.subcategories ?? []).includes(val)) {
      const newSubcats = [...(editingCategoryObj.subcategories ?? []), val];
      try {
        setPendingActionId("category:subcat");
        await updateCategory(editingCategory, { subcategories: newSubcats });
        setCategories(prev => prev.map(c => c.name === editingCategory ? { ...c, subcategories: newSubcats } : c));
        showSuccess("Subcategoria añadida");
      } catch (e) { console.error(e); showError("Error al actualizar subcategoria"); }
      finally { setPendingActionId(null); }
    }
    setSubcatDraft("");
  };

  const handleRemoveSubcat = async (subcat) => {
    if (!editingCategoryObj) return;
    const newSubcats = (editingCategoryObj.subcategories ?? []).filter(s => s !== subcat);
    try {
      setPendingActionId(`category:subcat:${subcat}`);
      await updateCategory(editingCategory, { subcategories: newSubcats });
      setCategories(prev => prev.map(c => c.name === editingCategory ? { ...c, subcategories: newSubcats } : c));
      showSuccess("Subcategoria eliminada");
    } catch (e) { console.error(e); showError("Error al eliminar subcategoria"); }
    finally { setPendingActionId(null); }
  };

  const openDeleteCategory = (category) => {
    const name = typeof category === 'string' ? category : category.name;
    const candidates = managedCategories.filter((item) => item.name !== name);
    setCategoryToDelete(name);
    setMoveTargetCategory(candidates[0]?.name ?? "");
    setCategoryError("");
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    if (productsInDeleteCategory.length > 0) {
      if (!deleteCategoryCandidates.length) {
        setCategoryError("Crea otra categoria antes de mover estos productos.");
        return;
      }

      if (!moveTargetCategory) {
        setCategoryError("Selecciona una categoria destino.");
        return;
      }
    }

    try {
      setPendingActionId("category:delete");
      await apiDeleteCategory(categoryToDelete, moveTargetCategory || undefined);
      
      if (productsInDeleteCategory.length > 0) {
        setProducts((prev) =>
          prev.map((product) =>
            product.cat === categoryToDelete
              ? { ...product, cat: moveTargetCategory }
              : product,
          ),
        );
      }

      const remainingCategories = managedCategories.filter(
        (category) => category.name !== categoryToDelete,
      );

      setCategories((prev) =>
        prev.filter((category) => category.name !== categoryToDelete),
      );

      if (activeCategory === categoryToDelete) {
        setActiveCategory(
          productsInDeleteCategory.length > 0
            ? moveTargetCategory
            : remainingCategories[0]?.name ?? null,
        );
      }

      setCategoryToDelete(null);
      setMoveTargetCategory("");
      setCategoryError("");
      showSuccess("Categoria eliminada");
    } catch (e) {
      console.error(e);
      setCategoryError("Error al eliminar");
      showError("Error al eliminar categoria");
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <>
      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total productos", value: kpis.total, color: "border-zinc-800" },
          { label: "Activos", value: kpis.active, color: "border-green-500/20 bg-green-500/5" },
          { label: "Stock crítico", value: kpis.lowStock, color: kpis.lowStock > 0 ? "border-red-500/30 bg-red-500/5" : "border-zinc-800" },
          { label: "Destacados", value: kpis.featured, color: "border-amber-500/20 bg-amber-500/5" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`glass rounded-2xl border p-4 ${color}`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
            <p className="text-3xl font-black text-white mt-1 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
        <aside className="glass p-6 rounded-[2rem] border border-zinc-800 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Categorías</p>
              <h3 className="text-base font-black italic uppercase text-white">Inventario</h3>
            </div>
            <button
              type="button"
              onClick={() => { setEditingCategory(null); setCategoryToDelete(null); }}
              className="bg-zinc-900 border border-zinc-800 text-white p-2 rounded-lg hover:border-green-500 transition-all"
              aria-label="Gestionar categorias"
            >
              <Package size={13} />
            </button>
          </div>

          <input
            type="text"
            value={categorySearch}
            onChange={(event) => setCategorySearch(event.target.value)}
            className="w-full bg-black border border-zinc-800 px-3 py-2 rounded-lg text-[11px] uppercase text-white outline-none focus:border-green-500"
            placeholder="Buscar categoría"
          />

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredCategories.length === 0 ? (
              <div className="text-[11px] uppercase tracking-widest text-zinc-600 border border-dashed border-zinc-800 rounded-xl p-4 text-center">
                Sin categorias
              </div>
            ) : (
              filteredCategories.map((categoryObj) => {
                const category = categoryObj.name;
                const isTodos = category === "Todos";
                const totalProducts = isTodos ? products.length : products.filter(
                  (product) => product.cat === category,
                ).length;

                return (
                  <div
                    key={category}
                    className={`rounded-xl border px-3 py-2 transition-all ${
                      selectedCategory === category
                        ? "border-green-500/40 bg-zinc-900"
                        : "border-zinc-800 bg-black/40 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className="flex-grow text-left flex items-center justify-between gap-2"
                      >
                        <span className="text-[11px] font-black uppercase tracking-wide text-white truncate">
                          {isTodos ? "Todas las categorías" : category}
                        </span>
                        <span className="text-[10px] font-black text-zinc-500 tabular-nums shrink-0">
                          {totalProducts}
                        </span>
                      </button>
                      {!isTodos && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openRenameCategory(category)}
                            className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[9px] font-black uppercase text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteCategory(category)}
                            className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-600 hover:text-red-500 hover:border-red-500/40 transition-all"
                            aria-label={`Eliminar ${category}`}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-zinc-900">
            <input
              type="text"
              value={newCategory}
              disabled={pendingActionId === "category:create"}
              onChange={(event) => { setNewCategory(event.target.value); if (categoryError) setCategoryError(""); }}
              className="w-full bg-black border border-zinc-800 px-3 py-2 rounded-lg text-[11px] uppercase text-white outline-none focus:border-green-500"
              placeholder="Nueva categoría…"
            />
            {categoryError && <p className="text-[10px] font-bold text-red-400">{categoryError}</p>}
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={pendingActionId === "category:create"}
              className="w-full bg-zinc-900 border border-zinc-800 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest text-white hover:border-green-500 hover:text-green-500 transition-all disabled:opacity-50"
            >
              {pendingActionId === "category:create" ? "Agregando..." : "+ Agregar categoría"}
            </button>
          </div>
        </aside>

        <section className="space-y-4">
          {/* Sub-view toggle */}
          <div className="glass rounded-2xl border border-zinc-800 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-grow">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                {inventoryView === "featured" ? "Destacados en Home" : (selectedCategory ? "Categoría" : "Inventario")}
              </p>
              <h3 className="text-2xl font-black italic uppercase text-white">
                {inventoryView === "featured" ? "Destacados" : (selectedCategory === "Todos" ? "Todas las categorías" : (selectedCategory ?? "Sin categorías"))}
              </h3>
              {inventoryView === "products" && (
                <p className="text-[10px] text-zinc-600 font-bold mt-0.5">{productsByActiveCategory.length} producto(s) en esta vista</p>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              {/* View toggle */}
              <div className="flex rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/60">
                <button type="button" onClick={() => setInventoryView("products")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    inventoryView === "products" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                  }`}>
                  <Package size={11}/>Productos
                </button>
                <button type="button" onClick={() => setInventoryView("featured")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    inventoryView === "featured" ? "bg-green-500 text-black" : "text-zinc-400 hover:text-green-400"
                  }`}>
                  <Sparkles size={11}/>Destacados
                </button>
              </div>
              {inventoryView === "products" && (
                <>
                  {/* Product search */}
                  <div className="relative flex-grow sm:w-44">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"/>
                    <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
                      placeholder="Buscar…"
                      className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-[11px] font-bold text-white outline-none focus:border-green-500/50 transition-all placeholder:text-zinc-700"/>
                  </div>
                  <button type="button" onClick={handleOpenNew} disabled={!managedCategories.length}
                    className="flex items-center gap-1.5 bg-green-500 hover:bg-white text-black disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0">
                    <Plus size={13}/> Nuevo
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Featured sub-view */}
          {inventoryView === "featured" ? (
            <FeaturedManager embedded={true} />
          ) : (<>

          {!managedCategories.length ? (
            <div className="text-center py-20 glass rounded-[2rem] border border-zinc-900 opacity-70 uppercase font-black tracking-widest">
              Crea una categoria para comenzar a cargar productos
            </div>
          ) : productsByActiveCategory.length === 0 ? (
            <div className="text-center py-20 glass rounded-[2rem] border border-zinc-900 opacity-70 uppercase font-black tracking-widest">
              No hay productos en esta categoria
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedProducts.map((product) => {
                const ss = stockStatus(product.stock);
                const SIcon = ss.icon;
                const isEditingStock = editingStockId === product.id;
                const productId = normalizeProductId(product.id);
                const pendingStock = pendingActionId === `stock:${productId}`;
                const pendingFeatured = pendingActionId === `featured:${productId}`;
                const pendingActive = pendingActionId === `active:${productId}`;
                const pendingDelete = pendingActionId === `delete:${productId}`;
                return (
                  <div key={product.id}
                    className={`glass rounded-2xl border transition-all ${
                      product.active === false ? "border-zinc-900 opacity-60" : "border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* Image */}
                      <div className="w-16 h-16 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center font-black italic text-zinc-700 text-sm uppercase overflow-hidden shrink-0">
                        {product.images?.[0]
                          ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover"/>
                          : <span className="text-[10px]">{product.label || "GS"}</span>}
                      </div>

                      {/* Info */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {product.sku && <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">#{product.sku}</span>}
                          {product.isFeatured && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500 text-black"><Star size={7} className="inline mr-0.5"/>TOP</span>}
                          {product.badge && product.badge.trim() && (
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400">{product.badge}</span>
                          )}
                          {product.active === false && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-500 flex items-center gap-0.5"><EyeOff size={7}/>Inactivo</span>}
                        </div>
                        <h4 className="text-[13px] font-black uppercase italic text-white tracking-tight truncate">{product.name}</h4>
                        <p className="text-[11px] text-green-500 font-black mt-0.5 tabular-nums">${Number(product.price).toLocaleString("es-CL")}</p>
                      </div>

                      {/* Stock control */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border flex items-center gap-1 ${ss.color}`}>
                          <SIcon size={9}/>{ss.label}
                        </span>
                        
                        {/* Variant Badges */}
                        {product.sizes && product.sizes.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-1 max-w-[120px]">
                            {product.sizes.map(size => {
                              const sInfo = (product.stockBySize || product.stock_by_size || {})[size];
                              if (!sInfo) return null;
                              return (
                                <span key={size} className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border ${sInfo.stock > 0 ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                                  {size}: {sInfo.stock}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {isEditingStock ? (
                          <div className="flex items-center gap-1">
                            <input type="number" value={stockDraft} onChange={e => setStockDraft(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") commitStockEdit(product.id); if (e.key === "Escape") setEditingStockId(null); }}
                              disabled={pendingStock}
                              className="w-16 bg-zinc-900 border border-green-500/50 rounded-lg px-2 py-1 text-[11px] font-black text-center text-white outline-none disabled:opacity-50" autoFocus/>
                            <button type="button" onClick={() => commitStockEdit(product.id)} disabled={pendingStock}
                              className="text-[9px] font-black text-green-500 border border-green-500/30 px-2 py-1 rounded-lg hover:bg-green-500/10 disabled:opacity-50">{pendingStock ? <Loader2 size={10} className="animate-spin" /> : "OK"}</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button type="button" 
                              onClick={() => adjustStock(product.id, -1)}
                              disabled={(product.sizes && product.sizes.length > 0) || pendingStock}
                              className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-20">
                              <Minus size={10}/>
                            </button>
                            <button type="button" 
                              onClick={() => { 
                                if (product.sizes && product.sizes.length > 0) return;
                                setEditingStockId(product.id); 
                                setStockDraft(String(product.stock ?? 0)); 
                              }}
                              className={`min-w-[2.5rem] text-center text-[13px] font-black text-white tabular-nums px-2 py-0.5 rounded-lg transition-all ${product.sizes && product.sizes.length > 0 ? "" : "hover:bg-zinc-900 border border-transparent hover:border-zinc-800"}`}>
                              {product.stock ?? 0}
                            </button>
                            <button type="button" 
                              onClick={() => adjustStock(product.id, 1)}
                              disabled={(product.sizes && product.sizes.length > 0) || pendingStock}
                              className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-20">
                              <Plus size={10}/>
                            </button>
                          </div>
                        )}
                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">unidades total</span>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button type="button" onClick={() => handleOpenEdit(product)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-[9px] font-black uppercase tracking-widest">
                          <Edit3 size={10}/>Editar
                        </button>
                        <button type="button" onClick={() => toggleProductFeatured(product.id)} disabled={pendingFeatured}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest ${
                            product.isFeatured ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30"
                          }`}>
                          {pendingFeatured ? <Loader2 size={10} className="animate-spin" /> : <Star size={10}/>}
                          {product.isFeatured ? "Quitar" : "TOP"}
                        </button>
                        <button type="button" onClick={() => toggleProductActive(product.id)} disabled={pendingActive}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-[9px] font-black uppercase tracking-widest disabled:opacity-50">
                          {pendingActive ? <Loader2 size={10} className="animate-spin" /> : product.active !== false ? <EyeOff size={10}/> : <Eye size={10}/>}
                          {product.active !== false ? "Ocultar" : "Activar"}
                        </button>
                        <button type="button" onClick={() => deleteProduct(product)} disabled={pendingDelete}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-500/30 transition-all text-[9px] font-black uppercase tracking-widest disabled:opacity-50">
                          {pendingDelete ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10}/>}
                          {pendingDelete ? "Eliminando" : "Eliminar"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="glass rounded-2xl border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Mostrando {showingStart}-{showingEnd} de {productsByActiveCategory.length} productos
                </p>
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 tabular-nums">
                    Página {currentPage} de {totalProductPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalProductPages, page + 1))}
                    disabled={currentPage === totalProductPages}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
          </>)}
        </section>
      </div>

      <ProductModal
        key={`${isModalOpen ? "open" : "closed"}-${productToEdit?.id ?? "new"}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingProduct={
          productToEdit ?? (selectedCategory ? { cat: selectedCategory } : null)
        }
      />

      {editingCategory ? (
        <SimpleModal title="Editar Categoria" onClose={() => { setEditingCategory(null); setSubcatDraft(""); }}>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Nombre de la Categoría</label>
              <input type="text" value={renameCategoryValue} onChange={(event) => {
                setRenameCategoryValue(event.target.value);
                if (categoryError) setCategoryError("");
              }} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs uppercase text-white outline-none focus:border-green-500" placeholder="Nombre de categoria" />
              {categoryError ? (
                <p className="text-[11px] font-bold text-red-400">{categoryError}</p>
              ) : null}
              <button type="button" onClick={handleRenameCategory} disabled={pendingActionId === "category:rename"} className="w-full bg-green-500 text-black py-3 mt-2 rounded-xl font-black text-[10px] uppercase italic hover:bg-white transition-colors disabled:opacity-50">
                {pendingActionId === "category:rename" ? "Guardando..." : "Renombrar Categoría"}
              </button>
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Subcategorías</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subcatDraft}
                  onChange={(e) => setSubcatDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddSubcat(); }}
                  className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs uppercase text-white outline-none focus:border-green-500"
                  placeholder="Nueva subcategoría..."
                />
                <button type="button" onClick={handleAddSubcat} disabled={pendingActionId === "category:subcat"} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 rounded-xl text-[10px] font-black uppercase transition-colors disabled:opacity-50">
                  {pendingActionId === "category:subcat" ? <Loader2 size={12} className="animate-spin" /> : "Añadir"}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {(editingCategoryObj?.subcategories || []).length === 0 ? (
                   <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Sin subcategorías</p>
                ) : (
                  editingCategoryObj.subcategories.map(subcat => (
                    <div key={subcat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">{subcat}</span>
                      <button type="button" onClick={() => handleRemoveSubcat(subcat)} disabled={pendingActionId === `category:subcat:${subcat}`} className="text-zinc-500 hover:text-red-400 disabled:opacity-50">
                        {pendingActionId === `category:subcat:${subcat}` ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </SimpleModal>
      ) : null}

      {categoryToDelete ? (
        <SimpleModal
          title="Eliminar Categoria"
          onClose={() => {
            setCategoryToDelete(null);
            setMoveTargetCategory("");
            setCategoryError("");
          }}
        >
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
              {productsInDeleteCategory.length > 0
                ? `La categoria ${categoryToDelete} tiene ${productsInDeleteCategory.length} producto(s).`
                : `La categoria ${categoryToDelete} se eliminara definitivamente.`}
            </p>
            {productsInDeleteCategory.length > 0 ? (
              deleteCategoryCandidates.length > 0 ? (
                <select value={moveTargetCategory} onChange={(event) => {
                  setMoveTargetCategory(event.target.value);
                  if (categoryError) setCategoryError("");
                }} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs uppercase text-white outline-none focus:border-green-500">
                  <option value="">Selecciona destino</option>
                  {deleteCategoryCandidates.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-4 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  Crea otra categoria antes de eliminar esta.
                </div>
              )
            ) : null}
            {categoryError ? (
              <p className="text-[11px] font-bold text-red-400">{categoryError}</p>
            ) : null}
            <button type="button" onClick={handleConfirmDeleteCategory} disabled={pendingActionId === "category:delete" || (productsInDeleteCategory.length > 0 && deleteCategoryCandidates.length === 0)} className="w-full bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black uppercase italic hover:bg-red-400 transition-colors">
              {pendingActionId === "category:delete" ? "Eliminando..." : "Confirmar eliminacion"}
            </button>
          </div>
        </SimpleModal>
      ) : null}
    </>
  );
}
