/* global Buffer, process */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const ROOT_DIR = resolve(process.cwd());
const UPLOADS_DIR = join(ROOT_DIR, 'data', 'uploads');
const ALLOWED_IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);
const MAX_IMAGE_BYTES = Math.max(1024, Number(process.env.MAX_IMAGE_UPLOAD_MB || 8) * 1024 * 1024);

if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Saves a base64 string as a file and returns the public URL path.
 * @param {string} base64Data 
 * @param {string} subDir 
 * @returns {string} The URL path (e.g., /uploads/products/xyz.png)
 */
export const saveBase64Image = (base64Data, subDir = 'products') => {
  const safeSubDir = String(subDir).replace(/[^a-z0-9_-]/gi, '') || 'products';
  if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:')) {
    return typeof base64Data === 'string' ? base64Data : '';
  }

  const [meta, data] = base64Data.split(',');
  const mimeType = meta.split(';')[0].replace('data:', '').toLowerCase();
  const extension = ALLOWED_IMAGE_TYPES.get(mimeType);

  if (!extension || !data) {
    throw new Error('Formato de imagen no permitido');
  }

  const buffer = Buffer.from(data, 'base64');
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error('La imagen supera el tamaño máximo permitido');
  }

  const fileName = `${randomUUID()}.${extension}`;
  
  const targetDir = join(UPLOADS_DIR, safeSubDir);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const filePath = join(targetDir, fileName);
  
  writeFileSync(filePath, buffer);
  
  return `/uploads/${safeSubDir}/${fileName}`;
};
