import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const SITE_URL = "https://galvarsport.com";
export const SITE_NAME = "Galvar Sport";
export const DEFAULT_IMAGE = `${SITE_URL}/hero/1.webp`;
export const DEFAULT_DESCRIPTION =
  "Tienda especializada en equipamiento profesional para deportes de contacto, entrenamiento, rendimiento y proteccion en Antofagasta, con envios a todo Chile.";

const upsertMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

const upsertLink = (rel, href, extraAttributes = {}) => {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
  Object.entries(extraAttributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

const upsertJsonLd = (id, data) => {
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement("script");
    element.id = id;
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data);
};

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = DEFAULT_IMAGE,
  type = "website",
  robots = "index, follow, max-image-preview:large",
  jsonLd,
}) {
  const location = useLocation();

  useEffect(() => {
    const normalizedPath = path ?? location.pathname;
    const canonicalUrl = new URL(normalizedPath, SITE_URL).toString();
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

    document.documentElement.lang = "es-CL";
    document.title = fullTitle;

    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: robots });
    upsertMeta('meta[name="author"]', { name: "author", content: SITE_NAME });
    upsertLink("canonical", canonicalUrl);

    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: "es_CL" });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
    upsertMeta('meta[property="og:image:alt"]', {
      property: "og:image:alt",
      content: "Galvar Sport, equipamiento profesional para deportes de contacto",
    });

    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });

    if (jsonLd) {
      upsertJsonLd("galvar-page-schema", jsonLd);
    }
  }, [description, image, jsonLd, location.pathname, path, robots, title, type]);

  return null;
}
