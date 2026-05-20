import { create } from 'zustand';
import {
  DEFAULT_ALLIANCES,
  DEFAULT_CATEGORIES,
  DEFAULT_FIGHTERS,
  DEFAULT_PRODUCTS,
} from "../data/catalog";
import {
  bootstrapApp,
  loginAdmin as loginAdminRequest,
  logoutAdmin as logoutAdminRequest,
  saveCart,
  saveCheckoutPrefs as saveCheckoutPrefsRequest,
} from "../services/api";

const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const toNumber = (value, fallback = 0) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseOfferDate = (value, boundary = "start") => {
  if (!value) return null;

  if (typeof value === "string" && DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return boundary === "end"
      ? new Date(year, month - 1, day, 23, 59, 59, 999)
      : new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isDateInOfferRange = (startDate, endDate, nowMs = Date.now()) => {
  const start = parseOfferDate(startDate, "start");
  const end = parseOfferDate(endDate, "end");

  if (start && start.getTime() > nowMs) return false;
  if (end && end.getTime() < nowMs) return false;
  return true;
};

const getStockBySizeTotal = (stockBySize) => {
  if (!stockBySize || typeof stockBySize !== "object" || Array.isArray(stockBySize)) {
    return null;
  }

  const entries = Object.values(stockBySize);
  if (entries.length === 0) return null;

  return entries.reduce((sum, info) => {
    if (info?.active === false) return sum;
    return sum + Math.max(0, toNumber(info?.stock, 0));
  }, 0);
};

const normalizeCatItem = (item) => {
  if (!item) return null;
  if (typeof item === "string") {
    const name = item.trim();
    return name ? { name, subcategories: [] } : null;
  }
  const name = String(item.name ?? "").trim();
  if (!name) return null;
  const subcategories = Array.isArray(item.subcategories)
    ? item.subcategories.map(s => String(s).trim()).filter(Boolean)
    : [];
  return { name, subcategories };
};

const normalizeCategoryList = (items) => {
  if (!Array.isArray(items)) return DEFAULT_CATEGORIES.map(normalizeCatItem).filter(Boolean);
  const map = new Map();
  for (const raw of items) {
    const cat = normalizeCatItem(raw);
    if (!cat || cat.name === "Todos") continue;
    if (!map.has(cat.name)) {
      map.set(cat.name, cat);
    } else {
      const existing = map.get(cat.name);
      if (cat.subcategories.length > existing.subcategories.length) {
        map.set(cat.name, cat);
      }
    }
  }
  return Array.from(map.values());
};

const normalizeProduct = (product) => {
  const id = String(product?.id || product?.sku || product?.name || Date.now()).trim();
  const rawOrder = product?.featuredOrder;
  const parsedOrder = rawOrder !== undefined && rawOrder !== null && rawOrder !== "" && !Number.isNaN(Number(rawOrder)) ? Number(rawOrder) : null;
  const stockBySize = product?.stockBySize || product?.stock_by_size || {};
  const variantStock = getStockBySizeTotal(stockBySize);
  const stock = variantStock ?? Math.max(0, toNumber(product?.stock, 0));
  const rawOfferPrice = product?.offerPrice ?? product?.offer_price;
  const offerPrice = rawOfferPrice !== undefined && rawOfferPrice !== null ? Math.max(0, toNumber(rawOfferPrice, 0)) : null;
  const offerStartDate = product?.offerStartDate ?? product?.offer_start_date ?? null;
  const offerEndDate = product?.offerEndDate ?? product?.offer_end_date ?? null;
  const isWeeklyOffer = Boolean(product?.isWeeklyOffer ?? product?.is_weekly_offer);
  const isOfferActive = isWeeklyOffer &&
    offerPrice > 0 &&
    stock > 0 &&
    isDateInOfferRange(offerStartDate, offerEndDate);

  return {
    ...product,
    id,
    sku: String(product?.sku ?? "").trim(),
    label: String(product?.label ?? "").trim().slice(0, 3),
    cat: String(product?.cat ?? product?.category ?? "Accesorios").trim() || "Accesorios",
    subcat: String(product?.subcat ?? "").trim(),
    name: String(product?.name ?? "").trim(),
    variant: String(product?.variant ?? product?.specialty ?? "").trim(),
    desc: String(product?.desc ?? product?.description ?? "").trim(),
    badge: String(product?.badge ?? "").trim(),
    isFeatured: Boolean(product?.isFeatured || String(product?.badge ?? "").trim().toUpperCase() === "TOP"),
    featuredOrder: parsedOrder !== null && parsedOrder < 9000 ? parsedOrder : null,
    active: product?.active === undefined ? true : Boolean(product?.active),
    price: Math.max(0, toNumber(product?.price, 0)),
    stock,
    sizes: Array.isArray(product?.sizes) ? product.sizes.map(s => String(s).trim()).filter(Boolean) : [],
    stockBySize,
    images: Array.isArray(product?.images) ? product.images.filter(Boolean) : [],
    isWeeklyOffer,
    isOfferActive,
    offerPrice,
    offerLabel: String(product?.offerLabel ?? product?.offer_label ?? "").trim(),
    offerStartDate,
    offerEndDate,
    offerOrder: toNumber(product?.offerOrder ?? product?.offer_order, 0),
    effectivePrice: isOfferActive ? offerPrice : Math.max(0, toNumber(product?.price, 0)),
  };
};

const normalizeCartItem = (item) => ({
  ...normalizeProduct(item),
  qty: Math.max(1, toNumber(item?.qty, 1)),
  size: item?.size ? String(item.size).trim() : null,
});

const normalizeAlliance = (alliance) => ({
  id: alliance?.id ?? Date.now(),
  nombre: String(alliance?.nombre ?? "").trim(),
  tag: String(alliance?.tag ?? "").trim(),
  ubicacion: String(alliance?.ubicacion ?? "").trim(),
  direccion: String(alliance?.direccion ?? "").trim(),
  email: String(alliance?.email ?? "").trim(),
  telefono: String(alliance?.telefono ?? "").trim(),
  horario: String(alliance?.horario ?? "").trim(),
  dias: String(alliance?.dias ?? "").trim(),
  status: String(alliance?.status ?? "partner").trim(),
  descripcion: String(alliance?.descripcion ?? "").trim(),
  imagen: String(alliance?.imagen ?? "").trim(),
  instagram: String(alliance?.instagram ?? "").trim(),
  website: String(alliance?.website ?? "").trim(),
});

const normalizeFighter = (fighter) => ({
  id: fighter?.id ?? Date.now(),
  name: String(fighter?.name ?? "").trim(),
  title: String(fighter?.title ?? "").trim(),
  specialty: String(fighter?.specialty ?? "").trim(),
  weight: String(fighter?.weight ?? "").trim(),
  level: String(fighter?.level ?? "AMATEUR").trim() || "AMATEUR",
  record: String(fighter?.record ?? "").trim(),
  handle: String(fighter?.handle ?? "").trim(),
  image: String(fighter?.image ?? "").trim(),
});

const normalizeCheckoutPrefs = (prefs) => ({
  fulfillment: ["pickup", "delivery", "chilexpress"].includes(prefs?.fulfillment) ? prefs.fulfillment : "pickup",
  paymentMethod: ["mercadopago", "whatsapp"].includes(prefs?.paymentMethod) ? prefs.paymentMethod : "whatsapp",
});

const debouncedPersist = {
  cart: debounce((items) => saveCart(items), 800),
  checkoutPrefs: debounce((items) => saveCheckoutPrefsRequest(items), 800),
};

export const useUIStore = create((set, get) => ({
  isBootstrapping: true,
  setIsBootstrapping: (val) => set({ isBootstrapping: val }),
  toast: { show: false, msg: "" },
  toastTimer: null,
  showNotification: (msg) => {
    const { toastTimer } = get();
    if (toastTimer) clearTimeout(toastTimer);
    const newTimer = setTimeout(() => set({ toast: { show: false, msg: "" } }), 3000);
    set({ toast: { show: true, msg }, toastTimer: newTimer });
  }
}));

export const useAuthStore = create((set) => ({
  isAdmin: false,
  setIsAdmin: (val) => set({ isAdmin: val }),
  loginAdmin: async (email, password) => {
    const response = await loginAdminRequest(email, password);
    set({ isAdmin: Boolean(response?.success || response?.isAdmin) });
    return response;
  },
  logoutAdmin: async () => {
    try {
      await logoutAdminRequest();
    } finally {
      set({ isAdmin: false });
    }
  }
}));

export const useCatalogStore = create((set, get) => ({
  products: [],
  customCategories: [],
  alliances: [],
  fighters: [],
  categories: [{ name: "Todos", subcategories: [] }],
  
  _updateCategories: () => {
    set(state => {
      const { customCategories, products } = state;
      const known = new Set(customCategories.map(c => c.name));
      const orphans = products.filter(p => p.cat && !known.has(p.cat)).reduce((acc, p) => {
          if (!acc.some(o => o.name === p.cat)) acc.push({ name: p.cat, subcategories: [] });
          return acc;
      }, []);
      return { categories: [{ name: "Todos", subcategories: [] }, ...customCategories, ...orphans] };
    });
  },

  setProducts: (updater) => {
    set(state => {
      const next = (Array.isArray(updater) ? updater : (typeof updater === 'function' ? updater(state.products) : [])).map(normalizeProduct);
      return { products: next };
    });
    get()._updateCategories();
  },
  
  setCategories: (updater) => {
    set(state => {
      const next = normalizeCategoryList(typeof updater === "function" ? updater(state.customCategories) : updater);
      return { customCategories: next };
    });
    get()._updateCategories();
  },

  setAlliances: (updater) => {
    set(state => {
      const next = (Array.isArray(updater) ? updater : (typeof updater === 'function' ? updater(state.alliances) : [])).map(normalizeAlliance);
      return { alliances: next };
    });
  },

  setFighters: (updater) => {
    set(state => {
      const next = (Array.isArray(updater) ? updater : (typeof updater === 'function' ? updater(state.fighters) : [])).map(normalizeFighter);
      return { fighters: next };
    });
  },
  
  bootstrap: async () => {
    try {
      const payload = await bootstrapApp();
      set({
        products: (Array.isArray(payload?.products) ? payload.products : DEFAULT_PRODUCTS).map(normalizeProduct),
        customCategories: normalizeCategoryList(Array.isArray(payload?.categories) ? payload.categories.filter(c => (typeof c === "string" ? c : c?.name) !== "Todos") : DEFAULT_CATEGORIES),
        alliances: (Array.isArray(payload?.alliances) ? payload.alliances : DEFAULT_ALLIANCES).map(normalizeAlliance),
        fighters: (Array.isArray(payload?.fighters) ? payload.fighters : DEFAULT_FIGHTERS).map(normalizeFighter)
      });
      useCartStore.getState().setCartRaw((Array.isArray(payload?.cart) ? payload.cart : []).map(normalizeCartItem));
      useCartStore.getState().setCheckoutPrefsRaw(normalizeCheckoutPrefs(payload?.checkoutPrefs));
      useAuthStore.getState().setIsAdmin(Boolean(payload?.isAdmin));
      get()._updateCategories();
    } catch (error) {
      console.error("Failed to bootstrap app state", error);
    } finally {
      useUIStore.getState().setIsBootstrapping(false);
    }
  }
}));

export const useCartStore = create((set) => ({
  cart: [],
  checkoutPrefs: normalizeCheckoutPrefs({}),
  
  setCartRaw: (cart) => set({ cart }),
  setCheckoutPrefsRaw: (checkoutPrefs) => set({ checkoutPrefs }),

  setCart: (updater) => {
    set(state => {
      const next = (Array.isArray(updater) ? updater : (typeof updater === 'function' ? updater(state.cart) : [])).map(normalizeCartItem);
      debouncedPersist.cart(next);
      return { cart: next };
    });
  },

  setCheckoutPrefs: (updater) => {
    set(state => {
      const next = normalizeCheckoutPrefs(typeof updater === "function" ? updater(state.checkoutPrefs) : updater);
      debouncedPersist.checkoutPrefs(next);
      return { checkoutPrefs: next };
    });
  },

  addToCart: (product, selectedSize = null) => {
    const normalized = normalizeProduct(product);
    if (!normalized.id || !normalized.name) return;

    // Determine max available stock for this variant or product
    let maxStock = normalized.stock;
    if (selectedSize) {
      const sInfo = (normalized.stockBySize || normalized.stock_by_size || {})[selectedSize];
      if (sInfo) {
        maxStock = Number(sInfo.stock) || 0;
      }
    }

    if (maxStock <= 0) {
      useUIStore.getState().showNotification(selectedSize ? `Talla ${selectedSize} sin stock` : "Producto sin stock disponible");
      return;
    }
    
    let reachedLimit = false;
    set(state => {
      const prev = state.cart;
      const existing = prev.find(item => item.id === normalized.id && item.size === selectedSize);
      let next;
      if (existing) {
        if (existing.qty >= maxStock) { 
          reachedLimit = true; 
          next = prev; 
        }
        else {
          next = prev.map(item => (item.id === normalized.id && item.size === selectedSize) ? { ...item, qty: item.qty + 1 } : item);
        }
      } else {
        next = [...prev, { ...normalized, qty: 1, size: selectedSize }];
      }
      if (!reachedLimit) debouncedPersist.cart(next);
      return { cart: next };
    });
    
    useUIStore.getState().showNotification(reachedLimit ? "Ya alcanzaste el stock disponible" : "Producto añadido al pedido");
  }
}));

// Setup initial bootstrap
useCatalogStore.getState().bootstrap();
