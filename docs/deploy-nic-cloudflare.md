# Despliegue Galvar Sport con NIC.CL, Cloudflare y VPS Ubuntu

Esta guia deja `galvarsport.cl` registrado en NIC.CL, usa Cloudflare como DNS/proxy/seguridad, y ejecuta la app en un VPS Ubuntu con Nginx, PostgreSQL, Node.js y PM2.

> Importante: las credenciales expuestas durante desarrollo deben rotarse antes de publicar: Gmail App Password, password de PostgreSQL, password admin y credenciales reales de Mercado Pago si se pasan a produccion.

## 1. NIC.CL y Cloudflare

1. En Cloudflare, agrega el sitio `galvarsport.cl`.
2. Copia los 2 nameservers que Cloudflare entregue.
3. En NIC.CL, abre el dominio `galvarsport.cl` y reemplaza los DNS actuales por esos 2 nameservers.
4. En Cloudflare > DNS crea:
   - `A` para `galvarsport.cl` apuntando a la IP del VPS, con proxy activado.
   - `CNAME` para `www` apuntando a `galvarsport.cl`, con proxy activado.
5. En Cloudflare > SSL/TLS:
   - Modo: `Full (strict)`.
   - Activar `Always Use HTTPS`.
   - Activar `Automatic HTTPS Rewrites`.
   - No usar `Flexible`.

## 2. Preparar VPS Ubuntu

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl nginx postgresql postgresql-contrib certbot python3-certbot-nginx
```

Instala Node.js LTS y PM2:

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Crear base de datos:

```bash
sudo -u postgres psql
```

Dentro de `psql`:

```sql
CREATE USER tienda_user WITH PASSWORD 'CAMBIAR_PASSWORD_POSTGRES';
CREATE DATABASE galvar_db OWNER tienda_user;
GRANT ALL PRIVILEGES ON DATABASE galvar_db TO tienda_user;
\c galvar_db
ALTER SCHEMA public OWNER TO tienda_user;
GRANT ALL ON SCHEMA public TO tienda_user;
\q
```

En PostgreSQL 15+ el permiso sobre la base de datos no siempre da permisos de creacion sobre el schema `public`. Prisma necesita poder crear la tabla `_prisma_migrations` en ese schema durante `prisma migrate deploy`.

Si una migracion falla en una base recien creada, revisa si la base quedo con una entrada fallida en `_prisma_migrations`. En una VPS nueva sin datos reales, lo mas simple es recrear la base y correr `npm run prisma:migrate` nuevamente despues de actualizar el repo.

## 3. Subir y configurar la app

```bash
cd /var/www
sudo git clone TU_REPOSITORIO_GIT galvar-sport
sudo chown -R $USER:$USER /var/www/galvar-sport
cd /var/www/galvar-sport
npm ci
cp deploy/env/.env.production.example .env
nano .env
```

Valores minimos que deben quedar correctos en `.env`:

```env
NODE_ENV=production
PORT=3001
BASE_URL="https://galvarsport.cl"
STORE_URL="https://galvarsport.cl"
CORS_ORIGINS="https://galvarsport.cl,https://www.galvarsport.cl"
DATABASE_URL="postgresql://tienda_user:CAMBIAR_PASSWORD_POSTGRES@localhost:5432/galvar_db?schema=public"
```

Ejecutar migraciones y build:

```bash
npm run prisma:migrate
npm run build
```

Prueba rapida local:

```bash
NODE_ENV=production npm start
```

En otra terminal:

```bash
curl http://127.0.0.1:3001/api/health
```

## 4. PM2

```bash
mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Ejecuta el comando que `pm2 startup` imprima en pantalla. Luego revisa:

```bash
pm2 status
pm2 logs galvar-sport
```

## 5. Nginx y HTTPS

Primero emite certificado con Certbot:

```bash
sudo certbot --nginx -d galvarsport.cl -d www.galvarsport.cl
```

Luego instala la configuracion recomendada:

```bash
sudo cp deploy/nginx/galvarsport.cloudflare.conf /etc/nginx/sites-available/galvarsport.cl
sudo ln -sfn /etc/nginx/sites-available/galvarsport.cl /etc/nginx/sites-enabled/galvarsport.cl
sudo nginx -t
sudo systemctl reload nginx
```

Si Certbot modifica la configuracion, conserva estas reglas:

- `proxy_pass http://127.0.0.1:3001;`
- `client_max_body_size 15M;`
- headers `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, `CF-Connecting-IP`.

## 6. Mercado Pago

Para la primera salida, mantener credenciales `TEST`.

Configura el webhook en Mercado Pago:

```text
https://galvarsport.cl/api/mercadopago/webhook
```

Valida:

- Checkout carga por HTTPS.
- Pago de prueba se procesa.
- Pedido cambia de estado.
- Inventario se descuenta.
- Correos llegan al cliente y al admin.

Cuando todo funcione, cambia a credenciales reales `APP_USR`, rota `MP_WEBHOOK_SECRET`, reconstruye el frontend y reinicia PM2:

```bash
npm run build
pm2 restart galvar-sport
```

## 7. Checklist final

```bash
npm run lint
npm run build
npm run prisma:migrate
sudo nginx -t
curl https://galvarsport.cl/api/health
pm2 logs galvar-sport --lines 100
```

Pruebas manuales:

- Home, tienda, carrito, checkout y admin.
- Login admin con cookie segura.
- Subida de imagen desde admin y visualizacion en `/uploads`.
- Compra Mercado Pago de prueba.
- Correos de compra y notificacion admin.
