import { getDb } from '../db.js';
import { randomUUID } from "node:crypto";

import bcrypt from 'bcryptjs';

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Faltan credenciales" });
  }

  try {
    const db = await getDb();
    
    // Buscar admin por email
    const admin = await db.get("SELECT * FROM admins WHERE email = ?", [String(email).trim().toLowerCase()]);
    
    if (!admin) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Verificar contraseña con bcrypt
    const isValid = await bcrypt.compare(String(password).trim(), admin.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Si ya tiene sesión, la actualizamos. Si no, creamos una.
    let sessionId = req.session?.id;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (!sessionId) {
      sessionId = randomUUID();
      await db.run(`
        INSERT INTO sessions (id, is_admin, cart, checkout_prefs, expires_at, created_at, updated_at)
        VALUES (?, 1, '[]', '{}', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [sessionId, expiresAt]);
    } else {
      await db.run(`
        UPDATE sessions SET is_admin = 1, expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `, [expiresAt, sessionId]);
    }

    // Configurar cookie segura
    res.cookie("gs_sid", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    });

    res.json({ success: true, token: sessionId });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const adminLogout = async (req, res) => {
  try {
    const db = await getDb();
    if (req.session?.id) {
      await db.run("UPDATE sessions SET is_admin = 0 WHERE id = ?", [req.session.id]);
    }
    
    res.clearCookie("gs_sid");
    res.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Error al cerrar sesión" });
  }
};
