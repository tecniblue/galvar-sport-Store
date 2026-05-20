import { prisma } from '../prisma.js';
import { saveBase64Image } from '../utils/file.utils.js';
import { sanitizeString } from '../utils/sanitize.js';
import { syncProductVariants } from '../services/inventory.service.js';

const normalizeString = (value) => sanitizeString(value);
const asId = (value, fallback) => sanitizeString(value || fallback);
const normalizeId = (value, fallback) => asId(value, fallback).slice(0, 120);
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
const normalizeStringList = (value) => (
  Array.isArray(value) ? value.map((item) => normalizeString(item)).filter(Boolean).slice(0, 50) : []
);
const buildProductImageRows = (productId, images) => (
  images
    .map((img, i) => ({
      product_id: productId,
      sort_order: i,
      url: saveBase64Image(img, 'products')
    }))
    .filter((row) => row.url)
);
const buildNestedProductImages = (images) => (
  images
    .map((img, i) => ({
      sort_order: i,
      url: saveBase64Image(img, 'products')
    }))
    .filter((row) => row.url)
);

/**
 * Normaliza el mapa de stock por talla.
 * Formato entrada: { "10-oz": { stock: 5, sku: "GS-10", active: true } }
 * @param {any} raw
 * @returns {Record<string, {stock: number, sku: string, active: boolean}>}
 */
const normalizeStockBySize = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result = {};
  for (const [size, info] of Object.entries(raw)) {
    const key = String(size).trim();
    if (!key) continue;
    result[key] = {
      stock: Math.max(0, Number(info?.stock) || 0),
      sku: sanitizeString(info?.sku ?? ''),
      active: info?.active === undefined ? true : Boolean(info.active),
    };
  }
  return result;
};

const normalizeProduct = (p) => {
  const stockBySize = normalizeStockBySize(p?.stockBySize ?? p?.stock_by_size);
  // Si hay variantes con stock, derivar el array sizes de sus keys
  const variantKeys = Object.keys(stockBySize);
  const rawSizes = Array.isArray(p?.sizes) ? p.sizes.map(s => String(s).trim()).filter(Boolean) : [];
  // Unir: mantener las tallas del array + cualquier key del stockBySize, en orden
  const allSizes = [...new Set([...rawSizes, ...variantKeys])];

  return {
    id: normalizeId(p?.id, p?.sku ?? p?.name ?? Date.now()),
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
    sizes: normalizeStringList(allSizes),
    stockBySize,
    images: Array.isArray(p?.images) ? p.images.filter(Boolean).slice(0, 12) : [],
    featuredOrder: p?.featuredOrder !== undefined ? (p.featuredOrder === null ? null : Number(p.featuredOrder)) : (p?.featured_order !== undefined ? (p.featured_order === null ? null : Number(p.featured_order)) : null),
    isWeeklyOffer: Boolean(p?.isWeeklyOffer ?? p?.is_weekly_offer),
    offerPrice: p?.offerPrice !== undefined ? (p.offerPrice === null ? null : Number(p.offerPrice)) : (p?.offer_price !== undefined ? (p.offer_price === null ? null : Number(p.offer_price)) : null),
    offerLabel: normalizeString(p?.offerLabel ?? p?.offer_label),
    offerStartDate: p?.offerStartDate ?? p?.offer_start_date ?? null,
    offerEndDate: p?.offerEndDate ?? p?.offer_end_date ?? null,
    offerOrder: Number(p?.offerOrder ?? p?.offer_order) || 0,
  };
};

const buildProductData = (p) => ({
  sku: p.sku,
  label: p.label,
  cat: p.cat,
  subcat: p.subcat,
  active: p.active ? 1 : 0,
  is_featured: p.isFeatured ? 1 : 0,
  price: p.price,
  stock: p.stock,
  variant: p.variant,
  name: p.name,
  desc: p.desc,
  badge: p.badge,
  sizes: p.sizes,
  stock_by_size: p.stockBySize,
  is_weekly_offer: p.isWeeklyOffer ? 1 : 0,
  offer_price: p.offerPrice,
  offer_label: p.offerLabel,
  offer_start_date: p.offerStartDate,
  offer_end_date: p.offerEndDate,
  offer_order: p.offerOrder,
  featured_order: p.featuredOrder,
});

export const createProduct = async (req, res) => {
  try {
    const p = normalizeProduct(req.body);
    
    await prisma.$transaction(async (tx) => {
      await tx.products.create({
        data: {
          id: p.id,
          ...buildProductData(p),
          product_images: {
            create: buildNestedProductImages(p.images)
          }
        }
      });
      await syncProductVariants(tx, p.id, p.stockBySize);
    });

    res.status(201).json({ ok: true, product: p });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Error al crear producto" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const p = normalizeProduct({ ...req.body, id });
    
    await prisma.$transaction(async (tx) => {
      const productData = buildProductData(p);
      await tx.products.upsert({
        where: { id },
        create: { id, ...productData },
        update: productData,
      });
      
      await tx.product_images.deleteMany({ where: { product_id: id } });
      const imageRows = buildProductImageRows(id, p.images);
      if (imageRows.length) {
        await tx.product_images.createMany({ data: imageRows });
      }
      await syncProductVariants(tx, id, p.stockBySize);
    });

    res.json({ ok: true, product: p });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // product_images has onDelete: Cascade in Prisma schema
    await prisma.products.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, subcategories } = req.body;
    const cleanName = normalizeString(name);
    if (!cleanName || cleanName === "Todos") return res.status(400).json({ error: "Nombre inválido" });
    
    const maxSort = await prisma.categories.aggregate({ _max: { sort_order: true } });
    const sort = (maxSort._max.sort_order || 0) + 1;
    
    await prisma.categories.create({
      data: {
        name: cleanName,
        sort_order: sort,
        subcategories: normalizeStringList(subcategories)
      }
    });
      
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ error: "Error al crear categoría" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name } = req.params; // old name
    const { newName, subcategories } = req.body;
    const cleanName = normalizeString(name);
    const finalName = normalizeString(newName || name);
    if (!finalName || finalName === "Todos") return res.status(400).json({ error: "Nombre inválido" });
    
    await prisma.$transaction(async (tx) => {
      await tx.categories.update({
        where: { name: cleanName },
        data: {
          name: finalName,
          subcategories: normalizeStringList(subcategories)
        }
      });
        
      if (finalName !== cleanName) {
        await tx.products.updateMany({
          where: { cat: cleanName },
          data: { cat: finalName }
        });
      }
    });
    
    res.json({ ok: true });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ error: "Error al actualizar categoría" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { name } = req.params;
    const { targetCategory } = req.body;
    const cleanName = normalizeString(name);
    const cleanTarget = normalizeString(targetCategory);
    
    await prisma.$transaction(async (tx) => {
      if (cleanTarget) {
        await tx.products.updateMany({
          where: { cat: cleanName },
          data: { cat: cleanTarget }
        });
      }
      await tx.categories.delete({ where: { name: cleanName } });
    });
    
    res.json({ ok: true });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ error: "Error al eliminar categoría" });
  }
};

// --- FIGHTERS ---
export const createFighter = async (req, res) => {
  try {
    const f = req.body;
    const imageUrl = saveBase64Image(f.image, 'fighters');
    
    await prisma.fighters.create({
      data: {
        id: normalizeId(f.id, Date.now().toString()),
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
    
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Create fighter error:", error);
    res.status(500).json({ error: "Error al crear guerrero" });
  }
};

export const updateFighter = async (req, res) => {
  try {
    const { id } = req.params;
    const f = req.body;
    const imageUrl = saveBase64Image(f.image, 'fighters');
    
    await prisma.fighters.update({
      where: { id },
      data: {
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
    
    res.json({ ok: true });
  } catch (error) {
    console.error("Update fighter error:", error);
    res.status(500).json({ error: "Error al actualizar guerrero" });
  }
};

export const deleteFighter = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fighters.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    console.error("Delete fighter error:", error);
    res.status(500).json({ error: "Error al eliminar guerrero" });
  }
};

// --- ALLIANCES ---
export const createAlliance = async (req, res) => {
  try {
    const a = req.body;
    const imageUrl = saveBase64Image(a.imagen, 'alliances');
    
    await prisma.alliances.create({
      data: {
        id: normalizeId(a.id, Date.now().toString()),
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
    
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Create alliance error:", error);
    res.status(500).json({ error: "Error al crear alianza" });
  }
};

export const updateAlliance = async (req, res) => {
  try {
    const { id } = req.params;
    const a = req.body;
    const imageUrl = saveBase64Image(a.imagen, 'alliances');
    
    await prisma.alliances.update({
      where: { id },
      data: {
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
    
    res.json({ ok: true });
  } catch (error) {
    console.error("Update alliance error:", error);
    res.status(500).json({ error: "Error al actualizar alianza" });
  }
};

export const deleteAlliance = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.alliances.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    console.error("Delete alliance error:", error);
    res.status(500).json({ error: "Error al eliminar alianza" });
  }
};
