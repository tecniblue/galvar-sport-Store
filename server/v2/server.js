import 'dotenv/config';
import { createApp } from './app.js';
import { getDb } from './db.js';

const PORT = Number(process.env.PORT) || 3001;

async function startServer() {
  try {
    // 1. Inicializar base de datos
    console.log('Inicializando base de datos...');
    await getDb();
    console.log('✅ Base de datos conectada');

    // 2. Crear app de Express
    const app = await createApp();

    // 3. Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor V2 (Express) corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
