import { escapeHtml } from '../../services/email/email.utils.js';

/**
 * Sanitizes a string for safe storage and display.
 * @param {string} value 
 * @returns {string}
 */
export const sanitizeString = (value) => {
  if (typeof value !== 'string') return '';
  // Trim and escape basic HTML tags
  return value.trim().replace(/[<>]/g, (tag) => {
    const chars = { '<': '&lt;', '>': '&gt;' };
    return chars[tag] || tag;
  });
};

/**
 * Sanitizes an object by applying sanitizeString to all its string properties.
 * @param {Object} obj 
 * @returns {Object}
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const newObj = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      newObj[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      newObj[key] = sanitizeObject(value);
    } else {
      newObj[key] = value;
    }
  }
  return newObj;
};
