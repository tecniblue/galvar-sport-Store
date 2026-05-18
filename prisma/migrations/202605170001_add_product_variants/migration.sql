CREATE TABLE IF NOT EXISTS product_variants (
  product_id TEXT NOT NULL,
  size TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (product_id, size),
  CONSTRAINT product_variants_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON product_variants(product_id);

INSERT INTO product_variants (product_id, size, sku, stock, active)
SELECT
  p.id AS product_id,
  variant.key AS size,
  COALESCE(variant.value->>'sku', '') AS sku,
  GREATEST(COALESCE((variant.value->>'stock')::integer, 0), 0) AS stock,
  COALESCE((variant.value->>'active')::boolean, true) AS active
FROM products p
CROSS JOIN LATERAL jsonb_each(p.stock_by_size::jsonb) AS variant(key, value)
WHERE jsonb_typeof(p.stock_by_size::jsonb) = 'object'
ON CONFLICT (product_id, size) DO UPDATE SET
  sku = EXCLUDED.sku,
  stock = EXCLUDED.stock,
  active = EXCLUDED.active;
