import {
  formatCurrency,
  formatDate,
  toHtmlText,
  getItemQuantity,
  formatFulfillment,
  formatPaymentMethod,
  ORDER_STATUS_MESSAGES,
  getOrderStatusLabel,
} from './email.utils.js';
import { getBaseStyles } from './email.styles.js';
import { getStaticLogoHtml } from './email.components.js';

export const getCustomerPurchaseTemplate = (order, storeContact) => {
  const itemsHtml = order.items
    .map((item) => {
      const quantity = getItemQuantity(item);
      const variant = item.variant ? `Variante: ${toHtmlText(item.variant)} | ` : "";
      const size = item.size ? `Talla: ${toHtmlText(item.size)} | ` : "";

      return `
        <tr>
          <td>
            <div class="item-name">${toHtmlText(item.name)}</div>
            <div class="item-meta">${size}${variant}Cantidad: ${quantity}</div>
          </td>
          <td style="text-align: right; font-weight: 600;">${formatCurrency(item.price * quantity)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${getBaseStyles()}
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${getStaticLogoHtml()}
        </div>

        <div class="content">
          <div class="title">&iexcl;Gracias por tu compra, ${toHtmlText(order.customer_name)}!</div>
          <div class="subtitle">Hemos recibido tu pedido y lo estamos procesando.</div>

          <div class="details-box">
            <h3 style="font-size: 15px; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #e4e4e7; padding-bottom: 8px;">Detalles de la Orden</h3>
            <div class="detail-row">
              <span class="detail-label">N&deg; de orden</span>
              <span class="detail-value">#${order.order_number}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha</span>
              <span class="detail-value">${toHtmlText(formatDate(order.created_at))}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">M&eacute;todo de entrega</span>
              <span class="detail-value">${formatFulfillment(order.fulfillment)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">M&eacute;todo de pago</span>
              <span class="detail-value">${formatPaymentMethod(order.payment_method)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Estado</span>
              <span class="badge">Confirmado</span>
            </div>

            <h3 style="font-size: 15px; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px solid #e4e4e7; padding-bottom: 8px;">Tus Datos</h3>
            <div class="detail-row">
              <span class="detail-label">Nombre</span>
              <span class="detail-value">${toHtmlText(order.customer_name)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">${toHtmlText(order.customer_email)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Tel&eacute;fono</span>
              <span class="detail-value">${toHtmlText(order.customer_phone)}</span>
            </div>
            ${order.rut ? `
              <div class="detail-row">
                <span class="detail-label">RUT</span>
                <span class="detail-value">${toHtmlText(order.rut)}</span>
              </div>
            ` : ""}
            ${order.comuna_region ? `
              <div class="detail-row">
                <span class="detail-label">Comuna/Regi&oacute;n</span>
                <span class="detail-value">${toHtmlText(order.comuna_region)}</span>
              </div>
            ` : ""}
            ${order.address ? `
              <div class="detail-row">
                <span class="detail-label">Direcci&oacute;n</span>
                <span class="detail-value">${toHtmlText(order.address)}</span>
              </div>
            ` : ""}
            ${order.notes ? `
              <div class="detail-row" style="margin-top: 8px; flex-direction: column;">
                <span class="detail-label" style="margin-bottom: 4px;">Notas de tu pedido</span>
                <span style="font-size: 14px; color: #18181b;">${toHtmlText(order.notes)}</span>
              </div>
            ` : ""}
          </div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="total-row">
                <td>Total pagado</td>
                <td style="text-align: right;">${formatCurrency(order.total)}</td>
              </tr>
            </tbody>
          </table>

          <p style="font-size: 14px; color: #52525b; line-height: 1.6;">
            Si seleccionaste retiro en tienda, te avisaremos cuando est&eacute; listo.
            Si necesitas ayuda, puedes contactarnos respondiendo a este correo o v&iacute;a WhatsApp.
          </p>
        </div>

        <div class="footer">
          <div class="footer-title">&iquest;Tienes preguntas?</div>
          <div class="footer-text">${toHtmlText(storeContact.email)} | ${toHtmlText(storeContact.phone)}</div>
          <div class="footer-text">${toHtmlText(storeContact.instagram)}</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getAdminPurchaseTemplate = (order) => {
  const itemsHtml = order.items
    .map((item) => {
      const quantity = getItemQuantity(item);
      const variant = item.variant ? `Var: ${toHtmlText(item.variant)} | ` : "";
      const size = item.size ? `Talla: ${toHtmlText(item.size)} | ` : "";

      return `
        <tr>
          <td style="padding: 15px 0; border-bottom: 1px solid #e4e4e7;">
            <strong style="color: #18181b; font-size: 15px;">${toHtmlText(item.name)}</strong><br/>
            <span style="font-size:13px; color:#71717a; margin-top: 4px; display: inline-block;">${size}${variant}SKU: ${toHtmlText(item.sku || "N/A")} | Cantidad: ${quantity}</span>
          </td>
          <td style="text-align: right; font-weight: 600; color: #18181b; padding: 15px 0; border-bottom: 1px solid #e4e4e7;">${formatCurrency(item.price * quantity)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${getBaseStyles()}
    </head>
    <body>
      <div class="container" style="border-top: 5px solid #000000; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
        <div class="header" style="background-color: #000000; padding: 30px 20px; text-align: center;">
          ${getStaticLogoHtml()}
          <div style="color: #a1a1aa; font-size: 12px; letter-spacing: 3px; margin-top: 15px;">ADMINISTRACI&Oacute;N</div>
        </div>

        <div class="content" style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="background-color: #10b981; color: white; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">&iexcl;Nueva Venta Recibida!</span>
          </div>

          <div class="details-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 35px;">
            <div class="detail-row" style="margin-bottom: 15px;">
              <span class="detail-label">Orden</span>
              <span class="detail-value" style="font-size: 20px; color: #0f172a;">#${order.order_number}</span>
            </div>
            <div class="detail-row" style="margin-bottom: 15px;">
              <span class="detail-label">Total recibido</span>
              <span class="detail-value" style="font-size: 20px; color: #059669;">${formatCurrency(order.total)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha</span>
              <span class="detail-value">${toHtmlText(formatDate(order.created_at))}</span>
            </div>
          </div>

          <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 30px; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Informaci&oacute;n del Cliente</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 35px; font-size: 14px;">
            <tbody>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Nombre</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; text-align: right; color: #0f172a;">${toHtmlText(order.customer_name)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; text-align: right; color: #0f172a;">
                  <a href="mailto:${toHtmlText(order.customer_email)}" style="color: #2563eb; text-decoration: none;">${toHtmlText(order.customer_email)}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Tel&eacute;fono</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; text-align: right; color: #0f172a;">${toHtmlText(order.customer_phone)}</td>
              </tr>
              ${order.rut ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">RUT</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; text-align: right; color: #0f172a;">${toHtmlText(order.rut)}</td>
              </tr>
              ` : ""}
              ${order.comuna_region ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Comuna/Regi&oacute;n</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; text-align: right; color: #0f172a;">${toHtmlText(order.comuna_region)}</td>
              </tr>
              ` : ""}
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">M&eacute;todo de entrega</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; text-align: right; color: #0f172a;">${formatFulfillment(order.fulfillment)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">M&eacute;todo de pago</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; text-align: right; color: #0f172a;">${formatPaymentMethod(order.payment_method)}</td>
              </tr>
              ${order.address ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Direcci&oacute;n</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; text-align: right; color: #0f172a;">${toHtmlText(order.address)}</td>
              </tr>
              ` : ""}
              ${order.notes ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Notas</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; text-align: right; color: #0f172a;">${toHtmlText(order.notes)}</td>
              </tr>
              ` : ""}
            </tbody>
          </table>

          <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 30px; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Resumen de Productos</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: center; margin-top: 50px; margin-bottom: 20px;">
            <a href="${toHtmlText(process.env.STORE_URL || "http://localhost:5173")}/admin"
               style="display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; letter-spacing: 0.5px; font-size: 15px;">
              Ir al Panel de Administrador
            </a>
          </div>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          Este es un correo autom&aacute;tico generado por el sistema de ventas de Galvar Sport.
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getCustomerStatusUpdateTemplate = (order, storeContact) => {
  const statusLabel = getOrderStatusLabel(order.status);
  const statusMessage =
    ORDER_STATUS_MESSAGES[order.status] ||
    "El estado de tu pedido fue actualizado.";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${getBaseStyles()}
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${getStaticLogoHtml()}
        </div>

        <div class="content">
          <div class="title">Actualizaci&oacute;n de tu pedido</div>
          <div class="subtitle">Hola ${toHtmlText(order.customer_name)}, tenemos novedades sobre tu compra.</div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">N&deg; de orden</span>
              <span class="detail-value">#${order.order_number}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Estado actual</span>
              <span class="badge">${statusLabel}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">M&eacute;todo de entrega</span>
              <span class="detail-value">${formatFulfillment(order.fulfillment)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">M&eacute;todo de pago</span>
              <span class="detail-value">${formatPaymentMethod(order.payment_method)}</span>
            </div>
            ${order.rut ? `
              <div class="detail-row">
                <span class="detail-label">RUT</span>
                <span class="detail-value">${toHtmlText(order.rut)}</span>
              </div>
            ` : ""}
            ${order.comuna_region ? `
              <div class="detail-row">
                <span class="detail-label">Comuna/Regi&oacute;n</span>
                <span class="detail-value">${toHtmlText(order.comuna_region)}</span>
              </div>
            ` : ""}
            ${order.address ? `
              <div class="detail-row">
                <span class="detail-label">Direcci&oacute;n</span>
                <span class="detail-value">${toHtmlText(order.address)}</span>
              </div>
            ` : ""}
            <div class="detail-row">
              <span class="detail-label">Total</span>
              <span class="detail-value">${formatCurrency(order.total)}</span>
            </div>
          </div>

          <p style="font-size: 15px; color: #3f3f46; line-height: 1.7; margin: 0 0 24px;">
            ${statusMessage}
          </p>

          <p style="font-size: 14px; color: #52525b; line-height: 1.6;">
            Si necesitas ayuda, puedes contactarnos respondiendo a este correo o v&iacute;a WhatsApp.
          </p>
        </div>

        <div class="footer">
          <div class="footer-title">&iquest;Tienes preguntas?</div>
          <div class="footer-text">${toHtmlText(storeContact.email)} | ${toHtmlText(storeContact.phone)}</div>
          <div class="footer-text">${toHtmlText(storeContact.instagram)}</div>
        </div>
      </div>
    </body>
    </html>
  `;
};
