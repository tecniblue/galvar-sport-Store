# Galvar Sport - Plataforma de Equipamiento Deportivo

Galvar Sport es una plataforma moderna de comercio electrónico especializada en equipamiento para deportes de combate y entrenamiento. Construida con tecnologías de vanguardia para ofrecer una experiencia rápida, segura y profesional.

## 🚀 Tecnologías

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Express.js (V2)
- **Base de Datos**: PostgreSQL
- **Pagos**: Integración con Mercado Pago
- **Notificaciones**: Sistema de correos con Nodemailer

## 🛠️ Configuración Local

### Requisitos Previos

- Node.js (v18+)
- PostgreSQL (v14+)
- Una cuenta de Mercado Pago (para pruebas de pago)

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
   Copia el archivo `.env.example` a `.env` y rellena las variables:
   ```bash
   cp .env.example .env
   ```

4. Configura PostgreSQL:
   Crea una base de datos y un usuario, luego actualiza las credenciales en el `.env`:
   ```bash
   PGHOST="localhost"
   PGUSER="tu_usuario"
   PGDATABASE="galvar_db"
   PGPASSWORD="tu_password"
   PGPORT=5432
   ```

### Desarrollo

Para iniciar tanto el cliente como el servidor en modo desarrollo:

```bash
npm run dev
```

O por separado:
- Servidor: `npm run dev:server`
- Cliente: `npm run dev:client`

## 📦 Despliegue

Para generar el build de producción del cliente:
```bash
npm run build
```

El servidor puede iniciarse en producción con:
```bash
npm start
```

## 📄 Licencia

Este proyecto es para uso exclusivo de Galvar Sport.
