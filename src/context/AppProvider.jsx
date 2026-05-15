import { createContext, useCallback, useEffect, useMemo, useRef, useState, useContext } from "react";
import { AppContext } from "./AppContext";
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
  saveCollection,
} from "../services/api";

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------
export const UIContext = createContext();
export const AuthContext = createContext();

export const useUI = () => useContext(UIContext);
export const useAuth = () => useContext(AuthContext);

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

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

/** Normalize a raw category input into { name: string, subcategories: string[] } */
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

/**
 * Deduplicate and normalize an array of categories.
 * "Todos" is always excluded — it is a UI-only concept.
 */
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
  const rawOrder = product?.featuredOrder;
  const parsedOrder =
    rawOrder !== undefined && rawOrder !== null && rawOrder !== "" && !Number.isNaN(Number(rawOrder))
      ? Number(rawOrder)
      : null;
  return {
    ...product,
    id: String(product?.id ?? product?.sku ?? product?.name ?? Date.now()),
    sku: String(product?.sku ?? "").trim(),
    label: String(product?.label ?? "").trim().slice(0, 3),
    cat: String(product?.cat ?? product?.category ?? "Accesorios").trim() || "Accesorios",
    subcat: String(product?.subcat ?? "").trim(),
    name: String(product?.name ?? "").trim(),
    variant: String(product?.variant ?? product?.specialty ?? "").trim(),
    desc: String(product?.desc ?? product?.description ?? "").trim(),
    badge: String(product?.badge ?? "").trim(),
    isFeatured: Boolean(
      product?.isFeatured || String(product?.badge ?? "").trim().toUpperCase() === "TOP"
    ),
    featuredOrder: parsedOrder !== null && parsedOrder < 9000 ? parsedOrder : null,
    active: product?.active === undefined ? true : Boolean(product?.active),
    price: Math.max(0, toNumber(product?.price, 0)),
    stock: Math.max(0, toNumber(product?.stock, 0)),
    sizes: Array.isArray(product?.sizes)
      ? product.sizes.map(s => String(s).trim()).filter(Boolean)
      : [],
    images: Array.isArray(product?.images) ? product.images.filter(Boolean) : [],
    // Ofertas de la Semana
    isWeeklyOffer: Boolean(product?.isWeeklyOffer),
    offerPrice: product?.offerPrice !== undefined && product?.offerPrice !== null ? Math.max(0, toNumber(product?.offerPrice, 0)) : null,
    offerLabel: String(product?.offerLabel ?? "").trim(),
    offerStartDate: product?.offerStartDate ?? null,
    offerEndDate: product?.offerEndDate ?? null,
    offerOrder: toNumber(product?.offerOrder, 0),
    effectivePrice: (Boolean(product?.isWeeklyOffer) && product?.offerPrice > 0) 
        ? Math.max(0, toNumber(product?.offerPrice, 0)) 
        : Math.max(0, toNumber(product?.price, 0)),
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
  fulfillment: ["pickup", "delivery", "chilexpress"].includes(prefs?.fulfillment)
    ? prefs.fulfillment
    : "pickup",
  paymentMethod: ["mercadopago", "whatsapp"].includes(prefs?.paymentMethod) ? prefs.paymentMethod : "whatsapp",
});

// ---------------------------------------------------------------------------
// Provider Components
// ---------------------------------------------------------------------------

export const AppProvider = ({ children }) => {
  const [customCategories, setCustomCategoriesState] = useState(normalizeCategoryList(DEFAULT_CATEGORIES));
  const [products, setProductsState] = useState(DEFAULT_PRODUCTS.map(normalizeProduct));
  const [cart, setCartState] = useState([]);
  const [alliances, setAlliancesState] = useState(DEFAULT_ALLIANCES.map(normalizeAlliance));
  const [fighters, setFightersState] = useState(DEFAULT_FIGHTERS.map(normalizeFighter));
  const [checkoutPrefs, setCheckoutPrefsState] = useState(normalizeCheckoutPrefs({}));
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: "" });

  const toastTimerRef = useRef(null);

  // Bootstrap from server
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const payload = await bootstrapApp();
        if (!isMounted) return;

        setProductsState((Array.isArray(payload?.products) ? payload.products : DEFAULT_PRODUCTS).map(normalizeProduct));
        const serverCats = Array.isArray(payload?.categories) ? payload.categories.filter(c => (typeof c === "string" ? c : c?.name) !== "Todos") : DEFAULT_CATEGORIES;
        setCustomCategoriesState(normalizeCategoryList(serverCats));
        setCartState((Array.isArray(payload?.cart) ? payload.cart : []).map(normalizeCartItem));
        setAlliancesState((Array.isArray(payload?.alliances) ? payload.alliances : DEFAULT_ALLIANCES).map(normalizeAlliance));
        setFightersState((Array.isArray(payload?.fighters) ? payload.fighters : DEFAULT_FIGHTERS).map(normalizeFighter));
        setCheckoutPrefsState(normalizeCheckoutPrefs(payload?.checkoutPrefs));
        setIsAdmin(Boolean(payload?.isAdmin));
      } catch (error) {
        console.error("Failed to bootstrap app state", error);
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const categories = useMemo(() => {
    const known = new Set(customCategories.map(c => c.name));
    const orphans = products.filter(p => p.cat && !known.has(p.cat)).reduce((acc, p) => {
        if (!acc.some(o => o.name === p.cat)) acc.push({ name: p.cat, subcategories: [] });
        return acc;
    }, []);
    return [{ name: "Todos", subcategories: [] }, ...customCategories, ...orphans];
  }, [customCategories, products]);

  // Debounced Persisters
  const debouncedPersist = useMemo(() => ({
    categories: debounce((items) => saveCollection("categories", items.filter(c => c.name !== "Todos")), 800),
    products: debounce((items) => saveCollection("products", items), 800),
    cart: debounce((items) => saveCart(items), 800),
    alliances: debounce((items) => saveCollection("alliances", items), 800),
    fighters: debounce((items) => saveCollection("fighters", items), 800),
    checkoutPrefs: debounce((items) => saveCheckoutPrefsRequest(items), 800),
  }), []);

  const setCategories = useCallback((updater) => {
    setCustomCategoriesState(prev => {
      const next = normalizeCategoryList(typeof updater === "function" ? updater(prev) : updater);
      debouncedPersist.categories(next);
      return next;
    });
  }, [debouncedPersist]);

  const createSyncedSetter = (setState, normalize, persistKey) => (updater) => {
    setState(prev => {
      const next = normalize(typeof updater === "function" ? updater(prev) : updater);
      debouncedPersist[persistKey](next);
      return next;
    });
  };

  const setProducts = useCallback(createSyncedSetter(setProductsState, (items) => (Array.isArray(items) ? items : []).map(normalizeProduct), 'products'), [debouncedPersist]);
  const setCart = useCallback(createSyncedSetter(setCartState, (items) => (Array.isArray(items) ? items : []).map(normalizeCartItem), 'cart'), [debouncedPersist]);
  const setAlliances = useCallback(createSyncedSetter(setAlliancesState, (items) => (Array.isArray(items) ? items : []).map(normalizeAlliance), 'alliances'), [debouncedPersist]);
  const setFighters = useCallback(createSyncedSetter(setFightersState, (items) => (Array.isArray(items) ? items : []).map(normalizeFighter), 'fighters'), [debouncedPersist]);
  const setCheckoutPrefs = useCallback(createSyncedSetter(setCheckoutPrefsState, normalizeCheckoutPrefs, 'checkoutPrefs'), [debouncedPersist]);

  const showNotification = useCallback((msg) => {
    setToast({ show: true, msg });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast({ show: false, msg: "" }), 3000);
  }, []);

  const addToCart = useCallback((product, selectedSize = null) => {
    const normalized = normalizeProduct(product);
    if (!normalized.id || !normalized.name) return;
    if (normalized.stock <= 0) return showNotification("Producto sin stock disponible");
    let reachedLimit = false;
    setCart(prev => {
      const existing = prev.find(item => item.id === normalized.id && item.size === selectedSize);
      if (existing) {
        if (existing.qty >= normalized.stock) { reachedLimit = true; return prev; }
        return prev.map(item => (item.id === normalized.id && item.size === selectedSize) ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...normalized, qty: 1, size: selectedSize }];
    });
    showNotification(reachedLimit ? "Ya alcanzaste el stock disponible" : "Producto añadido al pedido");
  }, [setCart, showNotification]);

  const loginAdmin = useCallback(async (email, password) => {
    const response = await loginAdminRequest(email, password);
    setIsAdmin(Boolean(response?.success || response?.isAdmin));
    return response;
  }, []);

  const logoutAdmin = useCallback(async () => {
    await logoutAdminRequest();
    setIsAdmin(false);
  }, []);

  const uiValue = useMemo(() => ({ toast, showNotification }), [toast, showNotification]);
  const authValue = useMemo(() => ({ isAdmin, loginAdmin, logoutAdmin }), [isAdmin, loginAdmin, logoutAdmin]);

  const value = useMemo(() => ({
    products, setProducts, categories, customCategories, setCategories, cart, setCart, alliances, setAlliances, fighters, setFighters, checkoutPrefs, setCheckoutPrefs, isBootstrapping, addToCart,
    ...uiValue, ...authValue
  }), [products, setProducts, categories, customCategories, setCategories, cart, setCart, alliances, setAlliances, fighters, setFighters, checkoutPrefs, setCheckoutPrefs, isBootstrapping, addToCart, uiValue, authValue]);

  return (
    <AuthContext.Provider value={authValue}>
      <UIContext.Provider value={uiValue}>
        <AppContext.Provider value={value}>{children}</AppContext.Provider>
      </UIContext.Provider>
    </AuthContext.Provider>
  );
};
