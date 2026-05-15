import { getDb } from '../db.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const db = await getDb();
    
    // 1. Extraer el session ID (desde Bearer token o Cookie)
    let sessionId = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      sessionId = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.gs_sid) {
      sessionId = req.cookies.gs_sid;
    }

    // 2. Validar sesión en DB
    if (sessionId) {
      const session = await db.get("SELECT * FROM sessions WHERE id = ?", [sessionId]);
      if (session) {
        // Verificar expiración
        const now = new Date();
        const expiry = session.expires_at ? new Date(session.expires_at) : null;
        
        if (expiry && now > expiry) {
          console.warn("Session expired:", sessionId);
          // Opcional: eliminar sesión de DB
        } else {
          req.session = session;
          req.isAdmin = session.is_admin === 1;
        }
      }
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    next(); // Continuamos sin sesión
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de administrador." });
  }
  next();
};
