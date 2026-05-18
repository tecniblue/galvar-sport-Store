/* global process */

import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { prisma } from '../prisma.js';

export const ensureInitialAdmin = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;

  const adminCount = await prisma.admins.count();
  if (adminCount > 0) return;

  if (ADMIN_PASSWORD.length < 12) {
    const message = "ADMIN_PASSWORD debe tener al menos 12 caracteres para producción.";
    if (process.env.NODE_ENV === 'production') throw new Error(message);
    console.warn(message);
  }

  const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_ROUNDS || 12));
  const hash = await bcrypt.hash(ADMIN_PASSWORD, salt);

  await prisma.admins.create({
    data: {
      id: randomUUID(),
      email: ADMIN_EMAIL.trim().toLowerCase(),
      password_hash: hash,
    },
  });

  console.log("First admin provisioned successfully.");
};
