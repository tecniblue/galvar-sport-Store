import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function checkDB() {
  const db = await open({
    filename: './server/v2/galvar.db',
    driver: sqlite3.Database
  });

  const products = await db.all("SELECT id, name, cat, subcat, active, stock FROM products");
  console.log("Total products in DB:", products.length);
  if (products.length > 0) {
    console.log("First 5 products:", JSON.stringify(products.slice(0, 5), null, 2));
  }

  const categories = await db.all("SELECT * FROM categories");
  console.log("Total categories in DB:", categories.length);
  if (categories.length > 0) {
    console.log("Categories:", JSON.stringify(categories, null, 2));
  }

  await db.close();
}

checkDB().catch(console.error);
