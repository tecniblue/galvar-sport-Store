/* global process */

import { prisma } from '../prisma.js';
import { saveBase64Image } from '../utils/file.utils.js';
import { sanitizeString } from '../utils/sanitize.js';
import {
  buildStockBySizeFromVariants,
  syncProductVariants,
} from '../services/inventory.service.js';

// parseJson removed as Prisma handles Json type natively

const normalizeString = (value) => sanitizeString(value);
const asId = (value, fallback) => sanitizeString(value || fallback);
const normalizeStringList = (value) => (
  Array.isArray(value) ? value.map((item) => normalizeString(item)).filter(Boolean).slice(0, 50) : []
);
const normalizeStockBySize = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result = {};
  for (const [size, info] of Object.entries(raw)) {
    const key = normalizeString(size);
    if (!key) continue;
    result[key] = {
      stock: Math.max(0, Number(info?.stock) || 0),
      sku: normalizeString(info?.sku ?? ''),
      active: info?.active === undefined ? true : Boolean(info.active),
    };
  }
  return result;
};
const normalizeUrl = (value) => {
  const text = normalizeString(value);
  if (!text) return "";
  if (text.startsWith('/uploads/')) return text;
  try {
    const url = new URL(text);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
};

const normalizeProduct = (p) => {
  const stockBySize = normalizeStockBySize(p?.stockBySize ?? p?.stock_by_size);
  const sizes = normalizeStringList([...new Set([
    ...(Array.isArray(p?.sizes) ? p.sizes : []),
    ...Object.keys(stockBySize),
  ])]);

  return {
    id: asId(p?.id, p?.sku ?? p?.name ?? Date.now()),
    sku: normalizeString(p?.sku),
    label: normalizeString(p?.label).slice(0, 3),
    cat: normalizeString(p?.cat ?? p?.category ?? "Accesorios") || "Accesorios",
    subcat: normalizeString(p?.subcat ?? ""),
    active: p?.active === undefined ? true : Boolean(p?.active),
    isFeatured: Boolean(p?.isFeatured ?? p?.is_featured ?? (normalizeString(p?.badge).toUpperCase() === "TOP")),
    price: Number(p?.price) || 0,
    stock: Math.max(0, Number(p?.stock) || 0),
    variant: normalizeString(p?.variant ?? p?.specialty),
    name: normalizeString(p?.name),
    desc: normalizeString(p?.desc ?? p?.description),
    badge: normalizeString(p?.badge),
    sizes,
    stockBySize,
    images: Array.isArray(p?.images) ? p.images.filter(Boolean) : [],
    featuredOrder: p?.featuredOrder !== undefined ? (p.featuredOrder === null ? null : Number(p.featuredOrder)) : (p?.featured_order !== undefined ? (p.featured_order === null ? null : Number(p.featured_order)) : null),
    isWeeklyOffer: Boolean(p?.isWeeklyOffer ?? p?.is_weekly_offer),
    offerPrice: p?.offerPrice !== undefined ? (p.offerPrice === null ? null : Number(p.offerPrice)) : (p?.offer_price !== undefined ? (p.offer_price === null ? null : Number(p.offer_price)) : null),
    offerLabel: normalizeString(p?.offerLabel ?? p?.offer_label),
    offerStartDate: p?.offerStartDate ?? p?.offer_start_date ?? null,
    offerEndDate: p?.offerEndDate ?? p?.offer_end_date ?? null,
    offerOrder: Number(p?.offerOrder ?? p?.offer_order) || 0,
  };
};

// Helper methods removed as Prisma handles relations and queries natively
const productIdentity = (product) => {
  const sku = normalizeString(product?.sku).toLowerCase();
  if (sku) return `sku::${sku}`;
  const name = normalizeString(product?.name).toLowerCase();
  const cat = normalizeString(product?.cat).toLowerCase();
  if (name && cat) return `name::${cat}::${name}`;
  return `id::${normalizeString(product?.id).toLowerCase()}`;
};

export const getBootstrap = async (req, res) => {
  try {
    const session = req.session || { cart: '[]', checkout_prefs: '{}', is_admin: 0 };
    
    const [products, categories, alliances, fighters] = await Promise.all([
      prisma.products.findMany({
        include: {
          product_images: { orderBy: { sort_order: 'asc' } },
          product_variants: { orderBy: { size: 'asc' } },
        },
        orderBy: { id: 'asc' }
      }),
      prisma.categories.findMany({ orderBy: { sort_order: 'asc' } }),
      prisma.alliances.findMany(),
      prisma.fighters.findMany()
    ]);

    const uniqueProducts = Array.from(
      products.reduce((map, product) => {
        const key = productIdentity(product);
        if (!map.has(key)) map.set(key, product);
        return map;
      }, new Map()).values()
    );

    res.json({
      products: uniqueProducts.map(p => ({
        ...p,
        active: p.active === 1,
        isFeatured: p.is_featured === 1,
        images: p.product_images.map(img => img.url),
        stockBySize: p.product_variants.length
          ? buildStockBySizeFromVariants(p.product_variants)
          : p.stock_by_size,
        isWeeklyOffer: p.is_weekly_offer === 1,
        offerPrice: p.offer_price,
        offerLabel: p.offer_label,
        offerStartDate: p.offer_start_date,
        offerEndDate: p.offer_end_date,
        offerOrder: p.offer_order,
        featuredOrder: p.featured_order,
      })),
      categories: [
        { name: "Todos", subcategories: [] },
        ...categories
      ],
      alliances,
      fighters,
      cart: session.cart,
      checkoutPrefs: session.checkout_prefs,
      isAdmin: Boolean(session.is_admin),
    });
  } catch (error) {
    console.error("Bootstrap error:", error);
    res.status(500).json({ error: "Error de bootstrap" });
  }
};

export const updateState = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const dangerousBulkKeys = new Set(["products", "categories", "fighters", "alliances"]);
    if (
      process.env.NODE_ENV === 'production' &&
      dangerousBulkKeys.has(key) &&
      process.env.ENABLE_BULK_STATE_WRITE !== 'true'
    ) {
      return res.status(403).json({
        error: "Actualización masiva deshabilitada en producción.",
      });
    }
    
    // CAPTURA DE IMÁGENES ANTES DE ACTUALIZAR
    const oldFighters = await prisma.fighters.findMany({ select: { image: true } });
    const oldAlliances = await prisma.alliances.findMany({ select: { imagen: true } });
    const oldProductImages = await prisma.product_images.findMany({ select: { url: true } });
    
    const oldImages = [
      ...oldFighters.map(f => f.image),
      ...oldAlliances.map(a => a.imagen),
      ...oldProductImages.map(p => p.url)
    ].filter(u => u && u.startsWith('/uploads/'));

    await prisma.$transaction(async (tx) => {
      if (key === "products") {
        const arr = Array.isArray(value) ? value : [];
        const incomingIds = arr.map(p => normalizeProduct(p).id);
        
        if (incomingIds.length > 0) {
          await tx.products.deleteMany({ where: { id: { notIn: incomingIds } } });
        } else {
          await tx.products.deleteMany({});
        }

        for (const p of arr) {
          const np = normalizeProduct(p);
          await tx.product_images.deleteMany({ where: { product_id: np.id } });

          await tx.products.upsert({
            where: { id: np.id },
            create: {
              id: np.id, sku: np.sku, label: np.label, cat: np.cat, subcat: np.subcat,
              active: np.active ? 1 : 0, is_featured: np.isFeatured ? 1 : 0,
              price: np.price, stock: np.stock, variant: np.variant, name: np.name,
              desc: np.desc, badge: np.badge, sizes: np.sizes, stock_by_size: np.stockBySize,
              is_weekly_offer: np.isWeeklyOffer ? 1 : 0, offer_price: np.offerPrice,
              offer_label: np.offerLabel, offer_start_date: np.offerStartDate,
              offer_end_date: np.offerEndDate, offer_order: np.offerOrder,
              featured_order: np.featuredOrder,
              product_images: {
                create: np.images.map((img, i) => ({
                  sort_order: i,
                  url: saveBase64Image(img, 'products')
                }))
              }
            },
            update: {
              sku: np.sku, label: np.label, cat: np.cat, subcat: np.subcat,
              active: np.active ? 1 : 0, is_featured: np.isFeatured ? 1 : 0,
              price: np.price, stock: np.stock, variant: np.variant, name: np.name,
              desc: np.desc, badge: np.badge, sizes: np.sizes, stock_by_size: np.stockBySize,
              is_weekly_offer: np.isWeeklyOffer ? 1 : 0, offer_price: np.offerPrice,
              offer_label: np.offerLabel, offer_start_date: np.offerStartDate,
              offer_end_date: np.offerEndDate, offer_order: np.offerOrder,
              featured_order: np.featuredOrder,
              product_images: {
                create: np.images.map((img, i) => ({
                  sort_order: i,
                  url: saveBase64Image(img, 'products')
                }))
              }
            }
          });
          await syncProductVariants(tx, np.id, np.stockBySize);
        }
      } else if (key === "categories") {
        await tx.categories.deleteMany({});
        const arr = Array.isArray(value) ? value : [];
        const seen = new Set();
        let sort = 0;
        for (const cat of arr) {
          if (!cat) continue;
          const name = normalizeString(typeof cat === 'string' ? cat : cat.name);
          if (!name || name === "Todos") continue;
          if (seen.has(name)) continue; 
          seen.add(name);
          const subcats = normalizeStringList(cat.subcategories);
          await tx.categories.create({
            data: { name, sort_order: sort++, subcategories: subcats }
          });
        }
      } else if (key === "fighters") {
        await tx.fighters.deleteMany({});
        const arr = Array.isArray(value) ? value : [];
        for (const f of arr) {
          const imageUrl = saveBase64Image(f.image, 'fighters');
          await tx.fighters.create({
            data: {
              id: asId(f.id, Date.now()).slice(0, 120),
              name: normalizeString(f.name),
              title: normalizeString(f.title),
              specialty: normalizeString(f.specialty),
              weight: normalizeString(f.weight),
              level: normalizeString(f.level) || "AMATEUR",
              record: normalizeString(f.record),
              handle: normalizeString(f.handle),
              image: imageUrl
            }
          });
        }
      } else if (key === "alliances") {
        await tx.alliances.deleteMany({});
        const arr = Array.isArray(value) ? value : [];
        for (const a of arr) {
          const imageUrl = saveBase64Image(a.imagen, 'alliances');
          await tx.alliances.create({
            data: {
              id: asId(a.id, Date.now()).slice(0, 120),
              nombre: normalizeString(a.nombre),
              tag: normalizeString(a.tag),
              ubicacion: normalizeString(a.ubicacion),
              direccion: normalizeString(a.direccion),
              email: normalizeString(a.email),
              telefono: normalizeString(a.telefono),
              horario: normalizeString(a.horario),
              dias: normalizeString(a.dias),
              status: normalizeString(a.status) || "partner",
              descripcion: normalizeString(a.descripcion),
              imagen: imageUrl,
              instagram: normalizeString(a.instagram),
              website: normalizeUrl(a.website)
            }
          });
        }
      } else {
        await tx.app_state.upsert({
          where: { key },
          create: { key, value: JSON.stringify(value) },
          update: { value: JSON.stringify(value), updated_at: new Date() }
        });
      }
    });

    // LIMPIEZA DE ARCHIVOS HUÉRFANOS
    try {
      const newFighters = await prisma.fighters.findMany({ select: { image: true } });
      const newAlliances = await prisma.alliances.findMany({ select: { imagen: true } });
      const newProductImages = await prisma.product_images.findMany({ select: { url: true } });
      
      const newImages = [
        ...newFighters.map(f => f.image),
        ...newAlliances.map(a => a.imagen),
        ...newProductImages.map(p => p.url)
      ].filter(u => u && u.startsWith('/uploads/'));
      
      const orphaned = oldImages.filter(url => !newImages.includes(url));
      if (orphaned.length > 0) {
        const { unlinkSync } = await import('node:fs');
        const { join, resolve } = await import('node:path');
        const ROOT_DIR = resolve(process.cwd());
        
        for (const url of orphaned) {
          try {
            const filePath = join(ROOT_DIR, 'data', url);
            unlinkSync(filePath);
          } catch { /* ignore delete errors */ }
        }
        console.log(`Limpieza de disco: ${orphaned.length} archivos eliminados.`);
      }
    } catch (e) {
      console.error("Error en limpieza de archivos:", e);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("Update state error:", error);
    res.status(500).json({ 
      error: "Error al actualizar estado", 
      details: error.message
    });
  }
};

export const updateCart = async (req, res) => {
  try {
    if (req.session?.id) {
      const cart = Array.isArray(req.body.value) ? req.body.value : [];
      await prisma.sessions.update({
        where: { id: req.session.id },
        data: { cart: cart, updated_at: new Date() }
      });
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Error" });
  }
};

export const updateCheckoutPrefs = async (req, res) => {
  try {
    if (req.session?.id) {
      const prefs = req.body.value && typeof req.body.value === 'object' ? req.body.value : {};
      await prisma.sessions.update({
        where: { id: req.session.id },
        data: { checkout_prefs: prefs, updated_at: new Date() }
      });
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Error" });
  }
};
