#!/usr/bin/env node
/* global process */
/**
 * Script para crear o actualizar el admin con las credenciales del .env
 * Uso: node scripts/reset-admin.js
 */
import 'dotenv/config';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

const { ADMIN_EMAIL, ADMIN_PASSWORD, PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Faltan ADMIN_EMAIL o ADMIN_PASSWORD en el .env');
  process.exit(1);
}

const pool = new pg.Pool({
  host: PGHOST,
  user: PGUSER,
  password: PGPASSWORD,
  database: PGDATABASE,
  port: parseInt(PGPORT || '5432'),
});

const client = await pool.connect();

try {
  if (ADMIN_PASSWORD.length < 12) {
    const message = 'ADMIN_PASSWORD debe tener al menos 12 caracteres para producción.';
    if (process.env.NODE_ENV === 'production') throw new Error(message);
    console.warn(`⚠️  ${message}`);
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_ROUNDS || 12));
  const hash = await bcrypt.hash(ADMIN_PASSWORD, salt);
  const email = ADMIN_EMAIL.trim().toLowerCase();

  const existing = await client.query('SELECT id FROM admins WHERE email = $1', [email]);

  if (existing.rows.length > 0) {
    await client.query('UPDATE admins SET password_hash = $1 WHERE email = $2', [hash, email]);
    console.log(`✅ Contraseña del admin "${ADMIN_EMAIL}" actualizada correctamente.`);
  } else {
    await client.query('INSERT INTO admins (id, email, password_hash) VALUES ($1, $2, $3)', [randomUUID(), email, hash]);
    console.log(`✅ Admin "${ADMIN_EMAIL}" creado correctamente.`);
  }

  console.log(`📧 Email: ${ADMIN_EMAIL}`);
} finally {
  client.release();
  await pool.end();
}
