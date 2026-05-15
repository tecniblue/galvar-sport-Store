import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { randomUUID } from 'node:crypto';

const ROOT_DIR = resolve(process.cwd());
const UPLOADS_DIR = join(ROOT_DIR, 'data', 'uploads');

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
  if (!base64Data || !base64Data.startsWith('data:image/')) {
    return base64Data; // Return as is if not base64
  }

  const [meta, data] = base64Data.split(',');
  const extension = meta.split(';')[0].split('/')[1] || 'png';
  const fileName = `${randomUUID()}.${extension}`;
  
  const targetDir = join(UPLOADS_DIR, subDir);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const filePath = join(targetDir, fileName);
  const buffer = Buffer.from(data, 'base64');
  
  writeFileSync(filePath, buffer);
  
  return `/uploads/${subDir}/${fileName}`;
};
