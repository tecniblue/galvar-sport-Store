import { Router } from 'express';
import { 
  createProduct, 
  updateProduct, 
  deleteProduct,
  createCategory, 
  updateCategory, 
  deleteCategory,
  createFighter,
  updateFighter,
  deleteFighter,
  createAlliance,
  updateAlliance,
  deleteAlliance
} from '../controllers/catalog.controller.js';
import { authMiddleware, requireAdmin, requireCsrf } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas del catálogo requieren ser Admin (salvo lecturas, pero esas están en bootstrap)
router.use(authMiddleware, requireAdmin, requireCsrf);

// Productos
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Categorías
router.post('/categories', createCategory);
router.patch('/categories/:name', updateCategory);
router.delete('/categories/:name', deleteCategory);

// Guerreros (Fighters)
router.post('/fighters', createFighter);
router.patch('/fighters/:id', updateFighter);
router.delete('/fighters/:id', deleteFighter);

// Alianzas (Alliances)
router.post('/alliances', createAlliance);
router.patch('/alliances/:id', updateAlliance);
router.delete('/alliances/:id', deleteAlliance);

export default router;
