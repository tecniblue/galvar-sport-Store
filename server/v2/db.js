import pg from 'pg';
import { resolve } from 'node:path';

const { Pool } = pg;

let dbInstance = null;

/**
 * Wrapper para PostgreSQL que imita la API básica de sqlite (all, get, run, exec)
 * para mantener compatibilidad con el resto del código.
 */
class PostgresWrapper {
  constructor(pool) {
    this.pool = pool;
  }

  // Traduce placeholders '?' a '$1, $2...'
  translateQuery(sql) {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  async all(sql, params = []) {
    const res = await this.pool.query(this.translateQuery(sql), params);
    return res.rows;
  }

  async get(sql, params = []) {
    const res = await this.pool.query(this.translateQuery(sql), params);
    return res.rows[0];
  }

  async run(sql, params = []) {
    const res = await this.pool.query(this.translateQuery(sql), params);
    return {
      changes: res.rowCount,
      lastID: res.rows[0]?.id || null
    };
  }

  async exec(sql) {
    await this.pool.query(sql);
  }
}

export const getDb = async () => {
  if (dbInstance) return dbInstance;

  console.log('Conectando a PostgreSQL...');
  const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT || 5432,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
  });

  dbInstance = new PostgresWrapper(pool);
  await initDbSchema(dbInstance);
  
  return dbInstance;
};

async function initDbSchema(db) {
  // Schema optimizado para PostgreSQL
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      name TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL DEFAULT 0,
      subcategories TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL DEFAULT '',
      label TEXT NOT NULL DEFAULT '',
      cat TEXT NOT NULL DEFAULT 'Accesorios',
      subcat TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      is_featured INTEGER NOT NULL DEFAULT 0,
      price DOUBLE PRECISION NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      variant TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      "desc" TEXT NOT NULL DEFAULT '',
      badge TEXT NOT NULL DEFAULT '',
      sizes TEXT NOT NULL DEFAULT '[]',
      featured_order INTEGER,
      is_weekly_offer INTEGER NOT NULL DEFAULT 0,
      offer_price DOUBLE PRECISION,
      offer_label TEXT NOT NULL DEFAULT '',
      offer_start_date TEXT,
      offer_end_date TEXT,
      offer_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_products_cat ON products(cat);

    CREATE TABLE IF NOT EXISTS product_images (
      product_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      url TEXT NOT NULL,
      PRIMARY KEY (product_id, sort_order),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alliances (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL DEFAULT '',
      tag TEXT NOT NULL DEFAULT '',
      ubicacion TEXT NOT NULL DEFAULT '',
      direccion TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      telefono TEXT NOT NULL DEFAULT '',
      horario TEXT NOT NULL DEFAULT '',
      dias TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'partner',
      descripcion TEXT NOT NULL DEFAULT '',
      imagen TEXT NOT NULL DEFAULT '',
      instagram TEXT NOT NULL DEFAULT '',
      website TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS fighters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      specialty TEXT NOT NULL DEFAULT '',
      weight TEXT NOT NULL DEFAULT '',
      level TEXT NOT NULL DEFAULT 'AMATEUR',
      record TEXT NOT NULL DEFAULT '',
      handle TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      is_admin INTEGER NOT NULL DEFAULT 0,
      cart TEXT NOT NULL DEFAULT '[]',
      checkout_prefs TEXT NOT NULL DEFAULT '{}',
      expires_at TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      order_number SERIAL PRIMARY KEY,
      id TEXT UNIQUE,
      customer_name TEXT NOT NULL DEFAULT '',
      customer_phone TEXT NOT NULL DEFAULT '',
      customer_email TEXT NOT NULL DEFAULT '',
      rut TEXT NOT NULL DEFAULT '',
      comuna_region TEXT NOT NULL DEFAULT '',
      client_order_id TEXT NOT NULL DEFAULT '',
      fulfillment TEXT NOT NULL DEFAULT 'pickup',
      payment_method TEXT NOT NULL DEFAULT 'whatsapp',
      address TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      items TEXT NOT NULL DEFAULT '[]',
      total DOUBLE PRECISION NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      mp_preference_id TEXT NOT NULL DEFAULT '',
      mp_payment_id TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_client_order_id ON orders(client_order_id) WHERE client_order_id <> '';

    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Provision first admin
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const adminCountRow = await db.get("SELECT COUNT(*) as count FROM admins");
    const adminCount = parseInt(adminCountRow.count);
    if (adminCount === 0) {
      console.log("No admins found, provisioning first admin...");
      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(ADMIN_PASSWORD, salt);
      const { randomUUID } = await import('node:crypto');
      await db.run(
        "INSERT INTO admins (id, email, password_hash) VALUES (?, ?, ?)",
        [randomUUID(), ADMIN_EMAIL, hash]
      );
      console.log("First admin provisioned successfully.");
    }
  }
}
