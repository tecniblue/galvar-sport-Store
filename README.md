# Galvar Sport - Plataforma de Equipamiento Deportivo (v1.2.0 - Stable Release)

Galvar Sport es una plataforma moderna y de alto rendimiento de comercio electrónico especializada en equipamiento profesional para deportes de contacto, rendimiento y protección. Construida con tecnologías de vanguardia para ofrecer una experiencia rápida, segura y completamente escalable.

---

## ✨ Características y Novedades (v1.2.0)

- **Gestión Avanzada de Inventario por Variante**: Sistema de stock granular por talla/variante con validación en tiempo real durante la selección y el proceso de pago para prevenir sobreventas.
- **Migración Completa a PostgreSQL + Prisma ORM**: Arquitectura robusta y escalable utilizando Prisma Client con conexión nativa a PostgreSQL para garantizar la integridad y concurrencia de datos.
- **Mercado Pago Checkout Bricks**: Integración nativa y optimizada del SDK de Mercado Pago con manejo robusto de webhooks para confirmación inmediata de pedidos.
- **Diseño Premium & Glassmorphism**: Interfaz moderna con tema oscuro, efectos de cristal (glassmorphism), texturas avanzadas y micro-animaciones dinámicas.
- **Sección de Filosofía y Ubicación Interactiva**: Integración de la Misión y Visión institucional junto con un mapa interactivo de Google Maps adaptado al diseño Dark Mode.

---

## 🚀 Tecnologías

- **Frontend**: React 19 + Vite + Tailwind CSS + Lucide React
- **Backend**: Express.js (V2) + Node.js
- **ORM & Base de Datos**: Prisma ORM + PostgreSQL
- **Pagos**: SDK de Mercado Pago (Payment Bricks & Webhooks)
- **Notificaciones**: Sistema de correos automatizados con Nodemailer

---

## 🛠️ Configuración Local

### Requisitos Previos

- Node.js (v18+)
- PostgreSQL (v14+)
- Cuenta de Mercado Pago (credenciales de producción/sandbox)

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/galvar-sport.git
   cd galvar-sport
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura el archivo `.env`:
   Copia el archivo `.env.example` a `.env` y rellena las variables obligatorias:
   ```bash
   cp .env.example .env
   ```
   Asegúrate de definir la URL de conexión a PostgreSQL y las credenciales de Mercado Pago:
   ```env
   DATABASE_URL="postgresql://usuario:password@localhost:5432/galvar_db?schema=public"
   MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."
   ```

4. Genera el cliente de Prisma y ejecuta las migraciones:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

### Desarrollo

Para iniciar de forma concurrente el servidor backend y el entorno de desarrollo frontend:

```bash
npm run dev
```

O por separado:
- Servidor Backend: `npm run dev:server`
- Cliente Frontend: `npm run dev:client`

---

## 📦 Despliegue en Producción

Para el despliegue recomendado en VPS Ubuntu con NIC.CL + Cloudflare + Nginx + PM2, revisa:

- [`docs/deploy-nic-cloudflare.md`](docs/deploy-nic-cloudflare.md)

1. Genera el build optimizado del cliente:
   ```bash
   npm run build
   ```

2. Inicia el servidor en modo producción:
   ```bash
   npm start
   ```

---

## 📄 Licencia

Este proyecto es para uso comercial exclusivo de **Galvar Sport**. Todos los derechos reservados.
