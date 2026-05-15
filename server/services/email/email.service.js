import nodemailer from "nodemailer";
import {
  getCustomerPurchaseTemplate,
  getAdminPurchaseTemplate,
  getCustomerStatusUpdateTemplate,
} from "./email.templates.js";
import { getOrderStatusLabel } from "./email.utils.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const isConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
const EMAIL_TIMEOUT_MS = Number(process.env.EMAIL_TIMEOUT_MS) || 15000;

const withTimeout = (promise, timeoutMs, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);

const sendMail = (mailOptions, label) =>
  withTimeout(transporter.sendMail(mailOptions), EMAIL_TIMEOUT_MS, label);

const getStoreContact = () => ({
  email: process.env.STORE_CONTACT_EMAIL || "ventas@galvarsport.com",
  phone: process.env.STORE_CONTACT_PHONE || "+56 9 1234 5678",
  instagram: process.env.STORE_INSTAGRAM || "@galvar_sport",
});

export const sendOrderEmails = async (order) => {
  if (!isConfigured()) {
    console.warn("Nodemailer is not configured. Skipping order emails.");
    return { ok: false, customerSent: false, adminSent: false, skipped: true };
  }

  const storeContact = getStoreContact();
  const result = { ok: false, customerSent: false, adminSent: false };

  if (order.customer_email) {
    try {
      await sendMail({
        from: `"Galvar Sport" <${process.env.SMTP_USER}>`,
        to: order.customer_email,
        subject: `Confirmaci\u00f3n de pedido #${order.order_number} - Galvar Sport`,
        html: getCustomerPurchaseTemplate(order, storeContact),
      }, "customer order email");
      result.customerSent = true;
      console.log(`Email sent to customer: ${order.customer_email}`);
    } catch (error) {
      console.error("Error sending customer order email:", error);
    }
  }

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
  if (adminEmail) {
    try {
      await sendMail({
        from: `"Galvar Sport Web" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `Nueva venta - Pedido #${order.order_number}`,
        html: getAdminPurchaseTemplate(order),
      }, "admin order email");
      result.adminSent = true;
      console.log(`Email sent to admin: ${adminEmail}`);
    } catch (error) {
      console.error("Error sending admin order email:", error);
    }
  }

  result.ok = Boolean(result.customerSent || result.adminSent);
  return result;
};

export const sendOrderStatusEmail = async (order) => {
  if (!isConfigured()) {
    console.warn("Nodemailer is not configured. Skipping status email.");
    return false;
  }

  if (!order.customer_email) {
    return false;
  }

  try {
    await sendMail({
      from: `"Galvar Sport" <${process.env.SMTP_USER}>`,
      to: order.customer_email,
      subject: `Pedido #${order.order_number}: ${getOrderStatusLabel(order.status)}`,
      html: getCustomerStatusUpdateTemplate(order, getStoreContact()),
    }, "customer status email");
    console.log(`Status email sent to customer: ${order.customer_email}`);
    return true;
  } catch (error) {
    console.error("Error sending status email:", error);
    return false;
  }
};
