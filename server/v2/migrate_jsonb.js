import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  await client.connect();
  try {
    console.log("Migrating columns to JSONB...");
    
    const columns = [
      { table: 'categories', col: 'subcategories', def: "'[]'::jsonb" },
      { table: 'orders', col: 'items', def: "'[]'::jsonb" },
      { table: 'products', col: 'sizes', colName: 'sizes', def: "'[]'::jsonb" },
      { table: 'sessions', col: 'cart', def: "'[]'::jsonb" },
      { table: 'sessions', col: 'checkout_prefs', def: "'{}'::jsonb" }
    ];

    for (const item of columns) {
      console.log(`- Migrating ${item.table}.${item.col}...`);
      // Drop default
      await client.query(`ALTER TABLE ${item.table} ALTER COLUMN ${item.col} DROP DEFAULT`);
      // Alter type
      await client.query(`ALTER TABLE ${item.table} ALTER COLUMN ${item.col} TYPE jsonb USING ${item.col}::jsonb`);
      // Set new default
      await client.query(`ALTER TABLE ${item.table} ALTER COLUMN ${item.col} SET DEFAULT ${item.def}`);
      console.log(`  OK`);
    }
    
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
