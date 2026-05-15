import { getDb } from '../db.js';
import { saveBase64Image } from '../utils/file.utils.js';
import { sanitizeString } from '../utils/sanitize.js';

const parseJson = (value, fallback) => {
  try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
};

const normalizeString = (value) => sanitizeString(value);
const asId = (value, fallback) => sanitizeString(value || fallback);

const normalizeProduct = (p) => ({
  id: asId(p?.id, p?.sku ?? p?.name ?? Date.now()),
  sku: normalizeString(p?.sku),
  label: normalizeString(p?.label).slice(0, 3),
  cat: normalizeString(p?.cat ?? p?.category ?? "Accesorios") || "Accesorios",
  subcat: normalizeString(p?.subcat ?? ""),
  active: p?.active === undefined ? true : Boolean(p?.active),
  isFeatured: Boolean(p?.isFeatured || normalizeString(p?.badge).toUpperCase() === "TOP"),
  price: Number(p?.price) || 0,
  stock: Math.max(0, Number(p?.stock) || 0),
  variant: normalizeString(p?.variant ?? p?.specialty),
  name: normalizeString(p?.name),
  desc: normalizeString(p?.desc ?? p?.description),
  badge: normalizeString(p?.badge),
  sizes: Array.isArray(p?.sizes) ? p.sizes.map(s => String(s).trim()).filter(Boolean) : [],
  images: Array.isArray(p?.images) ? p.images.filter(Boolean) : [],
  featuredOrder: p?.featuredOrder === null || p?.featuredOrder === undefined ? null : Number(p.featuredOrder),
  // Weekly Offer fields
  isWeeklyOffer: Boolean(p?.isWeeklyOffer),
  offerPrice: p?.offerPrice === null || p?.offerPrice === undefined ? null : Number(p?.offerPrice),
  offerLabel: normalizeString(p?.offerLabel),
  offerStartDate: p?.offerStartDate ?? null,
  offerEndDate: p?.offerEndDate ?? null,
  offerOrder: Number(p?.offerOrder) || 0,
});

const readProducts = async (db) => {
  const rows = await db.all("SELECT * FROM products ORDER BY id");
  const imgs = await db.all("SELECT * FROM product_images ORDER BY sort_order");
  const imgMap = {};
  for (const row of imgs) {
    if (!imgMap[row.product_id]) imgMap[row.product_id] = [];
    imgMap[row.product_id].push(row.url);
  }
  return rows.map((r) => ({
    id: r.id, sku: r.sku, label: r.label, cat: r.cat, subcat: r.subcat,
    active: r.active === 1, isFeatured: r.is_featured === 1,
    price: r.price, stock: r.stock, variant: r.variant,
    name: r.name, desc: r.desc, badge: r.badge,
    sizes: parseJson(r.sizes, []),
    images: imgMap[r.id] || [],
    featuredOrder: r.featured_order,
    isWeeklyOffer: r.is_weekly_offer === 1,
    offerPrice: r.offer_price,
    offerLabel: r.offer_label,
    offerStartDate: r.offer_start_date,
    offerEndDate: r.offer_end_date,
    offerOrder: r.offer_order,
  }));
};

const readCategories = async (db) => {
  const rows = await db.all("SELECT * FROM categories ORDER BY sort_order");
  return [
    { name: "Todos", subcategories: [] },
    ...rows.map(r => ({
      name: r.name,
      subcategories: parseJson(r.subcategories, [])
    }))
  ];
};

const readAlliances = async (db) => {
  const rows = await db.all("SELECT * FROM alliances");
  return rows;
};

const readFighters = async (db) => {
  const rows = await db.all("SELECT * FROM fighters");
  return rows;
};

export const getBootstrap = async (req, res) => {
  try {
    const db = await getDb();
    const session = req.session || { cart: '[]', checkout_prefs: '{}', is_admin: 0 };
    
    res.json({
      products: await readProducts(db),
      categories: await readCategories(db),
      alliances: await readAlliances(db),
      fighters: await readFighters(db),
      cart: parseJson(session.cart, []),
      checkoutPrefs: parseJson(session.checkout_prefs, {}),
      isAdmin: Boolean(session.is_admin),
    });
  } catch (error) {
    console.error("Bootstrap error:", error);
    res.status(500).json({ error: "Error de bootstrap" });
  }
};

export const updateState = async (req, res) => {
  try {
    const db = await getDb();
    const { key } = req.params;
    // CAPTURA DE IMÁGENES ANTES DE ACTUALIZAR (Para limpieza de disco)
    const oldImages = (await db.all("SELECT url FROM product_images UNION SELECT image as url FROM fighters UNION SELECT imagen as url FROM alliances"))
      .map(r => r.url)
      .filter(u => u && u.startsWith('/uploads/'));

    await db.run("BEGIN TRANSACTION");
    if (key === "products") {
      await db.run("DELETE FROM products");
      await db.run("DELETE FROM product_images");
      const arr = Array.isArray(value) ? value : [];
      for (const p of arr) {
        const np = normalizeProduct(p);
        await db.run(`INSERT INTO products (id, sku, label, cat, subcat, active, is_featured, price, stock, variant, name, desc, badge, sizes, is_weekly_offer, offer_price, offer_label, offer_start_date, offer_end_date, offer_order, featured_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [
          np.id, np.sku, np.label, np.cat, np.subcat, np.active ? 1 : 0, np.isFeatured ? 1 : 0, 
          np.price, np.stock, np.variant, np.name, np.desc, np.badge, JSON.stringify(np.sizes),
          np.isWeeklyOffer ? 1 : 0, np.offerPrice, np.offerLabel, np.offerStartDate, np.offerEndDate, np.offerOrder, np.featuredOrder
        ]);
        for (let i = 0; i < np.images.length; i++) {
          const imageUrl = saveBase64Image(np.images[i], 'products');
          await db.run("INSERT INTO product_images (product_id, sort_order, url) VALUES (?, ?, ?)", [np.id, i, imageUrl]);
        }
      }
    } else if (key === "categories") {
      await db.run("DELETE FROM categories");
      const arr = Array.isArray(value) ? value : [];
      const seen = new Set();
      let sort = 0;
      for (const cat of arr) {
        if (!cat) continue;
        const name = typeof cat === 'string' ? cat : cat.name;
        if (!name || name === "Todos") continue;
        if (seen.has(name)) continue; 
        seen.add(name);
        const subcats = Array.isArray(cat.subcategories) ? cat.subcategories : [];
        await db.run("INSERT INTO categories (name, sort_order, subcategories) VALUES (?, ?, ?)", [name, sort++, JSON.stringify(subcats)]);
      }
    } else if (key === "fighters") {
      await db.run("DELETE FROM fighters");
      const arr = Array.isArray(value) ? value : [];
      for (const f of arr) {
        const imageUrl = saveBase64Image(f.image, 'fighters');
        await db.run(
          "INSERT INTO fighters (id, name, title, specialty, weight, level, record, handle, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [f.id, f.name, f.title, f.specialty, f.weight, f.level, f.record, f.handle, imageUrl]
        );
      }
    } else if (key === "alliances") {
      await db.run("DELETE FROM alliances");
      const arr = Array.isArray(value) ? value : [];
      for (const a of arr) {
        const imageUrl = saveBase64Image(a.imagen, 'alliances');
        await db.run(
          "INSERT INTO alliances (id, nombre, tag, ubicacion, direccion, email, telefono, horario, dias, status, descripcion, imagen, instagram, website) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [a.id, a.nombre, a.tag, a.ubicacion, a.direccion, a.email, a.telefono, a.horario, a.dias, a.status, a.descripcion, imageUrl, a.instagram, a.website]
        );
      }
    } else {
      await db.run("INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP", 
      [key, JSON.stringify(value)]);
    }
    await db.run("COMMIT");

    // LIMPIEZA DE ARCHIVOS HUÉRFANOS
    try {
      const newImages = (await db.all("SELECT url FROM product_images UNION SELECT image as url FROM fighters UNION SELECT imagen as url FROM alliances"))
        .map(r => r.url)
        .filter(u => u && u.startsWith('/uploads/'));
      
      const orphaned = oldImages.filter(url => !newImages.includes(url));
      if (orphaned.length > 0) {
        const { unlinkSync } = await import('node:fs');
        const { join, resolve } = await import('node:path');
        const ROOT_DIR = resolve(process.cwd());
        
        for (const url of orphaned) {
          try {
            const filePath = join(ROOT_DIR, 'data', url);
            unlinkSync(filePath);
          } catch (e) { /* ignore delete errors */ }
        }
        console.log(`Limpieza de disco: ${orphaned.length} archivos eliminados.`);
      }
    } catch (e) {
      console.error("Error en limpieza de archivos:", e);
    }

    res.json({ ok: true });
  } catch (error) {
    try { await (await getDb()).run("ROLLBACK"); } catch (e) { /* ignore rollback error */ }
    console.error("Update state error:", error);
    res.status(500).json({ 
      error: "Error al actualizar estado", 
      details: error.message,
      stack: error.stack 
    });
  }
};

export const updateCart = async (req, res) => {
  try {
    const db = await getDb();
    if (req.session?.id) {
      const cart = Array.isArray(req.body.value) ? req.body.value : [];
      await db.run("UPDATE sessions SET cart = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [JSON.stringify(cart), req.session.id]);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Error" });
  }
};

export const updateCheckoutPrefs = async (req, res) => {
  try {
    const db = await getDb();
    if (req.session?.id) {
      const prefs = req.body.value && typeof req.body.value === 'object' ? req.body.value : {};
      await db.run("UPDATE sessions SET checkout_prefs = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [JSON.stringify(prefs), req.session.id]);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Error" });
  }
};
