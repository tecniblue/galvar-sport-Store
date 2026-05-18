const toStockBySize = (value) => (
  value && typeof value === 'object' && !Array.isArray(value) ? value : {}
);

const hasVariantStock = (product) => (
  Array.isArray(product?.product_variants) && product.product_variants.length > 0
) || Object.keys(toStockBySize(product?.stock_by_size)).length > 0;

export const getEffectivePrice = (product, now = new Date()) => {
  let price = Number(product.price) || 0;
  if (product.is_weekly_offer === 1 && product.offer_price !== null && product.offer_price !== undefined) {
    let active = true;
    if (product.offer_start_date && now < new Date(product.offer_start_date)) active = false;
    if (product.offer_end_date && now > new Date(product.offer_end_date)) active = false;
    if (active) price = Number(product.offer_price) || 0;
  }
  return Math.max(0, price);
};

export const syncProductVariants = async (tx, productId, stockBySize = {}) => {
  const entries = Object.entries(toStockBySize(stockBySize));
  await tx.product_variants.deleteMany({ where: { product_id: productId } });

  if (!entries.length) return;

  const data = entries.map(([size, info]) => ({
      product_id: productId,
      size: String(size).trim(),
      sku: String(info?.sku ?? '').trim(),
      stock: Math.max(0, Number(info?.stock) || 0),
      active: info?.active === undefined ? true : Boolean(info.active),
    })).filter((variant) => variant.size);

  if (!data.length) return;
  await tx.product_variants.createMany({ data });
};

export const buildStockBySizeFromVariants = (variants = []) => {
  const result = {};
  for (const variant of variants) {
    if (!variant?.size) continue;
    result[variant.size] = {
      stock: Math.max(0, Number(variant.stock) || 0),
      sku: String(variant.sku || ''),
      active: variant.active !== false,
    };
  }
  return result;
};

export const reserveOrderItemStock = async (tx, product, item, qty) => {
  const itemSize = String(item.size || '').trim();
  const variants = Array.isArray(product.product_variants) ? product.product_variants : [];

  if (variants.length > 0 || hasVariantStock(product)) {
    if (!itemSize) {
      throw new Error(`${product.name} requiere que selecciones una talla antes de comprar.`);
    }

    const variant = variants.find((entry) => entry.size === itemSize);
    if (!variant) {
      throw new Error(`La variante "${itemSize}" no existe en ${product.name}.`);
    }
    if (variant.active === false) {
      throw new Error(`La variante "${itemSize}" de ${product.name} no está disponible.`);
    }

    const updated = await tx.product_variants.updateMany({
      where: {
        product_id: product.id,
        size: itemSize,
        active: true,
        stock: { gte: qty },
      },
      data: { stock: { decrement: qty } },
    });

    if (updated.count !== 1) {
      throw new Error(
        `Stock insuficiente para ${product.name} (Talla: ${itemSize}). Disponible: ${Math.max(0, Number(variant.stock) || 0)}`
      );
    }

    return {
      size: itemSize,
      sku: variant.sku || product.sku,
    };
  }

  const updatedStock = await tx.products.updateMany({
    where: { id: product.id, stock: { gte: qty } },
    data: { stock: { decrement: qty } },
  });

  if (updatedStock.count !== 1) {
    throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);
  }

  return {
    size: itemSize,
    sku: product.sku,
  };
};

export const releaseOrderItemStock = async (tx, item) => {
  const qty = Number(item.qty) || 0;
  if (qty <= 0) return;

  const itemSize = String(item.size || '').trim();
  if (itemSize) {
    const updated = await tx.product_variants.updateMany({
      where: { product_id: item.id, size: itemSize },
      data: { stock: { increment: qty } },
    });
    if (updated.count === 1) return;
  }

  await tx.products.updateMany({
    where: { id: item.id },
    data: { stock: { increment: qty } },
  });
};
