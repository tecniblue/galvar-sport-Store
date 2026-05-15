#!/usr/bin/env node
/**
 * Script para crear o actualizar el admin con las credenciales del .env
 * Uso: node scripts/reset-admin.js
 */
import 'dotenv/config';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

const ROOT_DIR = resolve(process.cwd());
const DATA_DIR = join(ROOT_DIR, 'data');
const DB_PATH = join(DATA_DIR, 'app.sqlite');

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Faltan ADMIN_EMAIL o ADMIN_PASSWORD en el .env');
  process.exit(1);
}

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = await open({ filename: DB_PATH, driver: sqlite3.Database });

await db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash(ADMIN_PASSWORD, salt);

const existing = await db.get('SELECT id FROM admins WHERE email = ?', [ADMIN_EMAIL.trim().toLowerCase()]);

if (existing) {
  await db.run('UPDATE admins SET password_hash = ? WHERE email = ?', [hash, ADMIN_EMAIL.trim().toLowerCase()]);
  console.log(`✅ Contraseña del admin "${ADMIN_EMAIL}" actualizada correctamente.`);
} else {
  await db.run('INSERT INTO admins (id, email, password_hash) VALUES (?, ?, ?)', [randomUUID(), ADMIN_EMAIL.trim().toLowerCase(), hash]);
  console.log(`✅ Admin "${ADMIN_EMAIL}" creado correctamente.`);
}

console.log(`📧 Email: ${ADMIN_EMAIL}`);
console.log(`🔑 Contraseña: ${ADMIN_PASSWORD}`);

await db.close();
