import React, { memo } from "react";
import { ShoppingCart, Zap, Info } from "lucide-react";
import "./ProductCard.css";

export default memo(function ProductCard({
  product,
  variant = "store",
  onAddToCart,
  onViewDetails,
}) {
  const isFeatured = variant === "featured";
  const stock = Number(product?.stock);
  const hasStockInfo = Number.isFinite(stock);
  const isOutOfStock = hasStockInfo && stock <= 0;
  const hasSizes = Array.isArray(product?.sizes) && product.sizes.length > 0;
  const isOfferActive = Boolean(product?.isOfferActive);
  const fallbackLabel =
    String(product?.label ?? "").trim() ||
    String(product?.name ?? "GS").trim().slice(0, 2).toUpperCase();

  return (
    <div
      className={`product-card product-card--${variant}${
        isOutOfStock ? " product-card--sold-out" : ""
      }${isOfferActive ? " product-card--on-offer" : ""}`}
      onClick={() => onViewDetails?.(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onViewDetails?.(product);
        }
      }}
    >
      <div className="product-card__image-wrapper">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="product-card__image"
            loading="lazy"
          />
        ) : (
          <div className="product-card__image-fallback" aria-hidden="true">
            <span>{fallbackLabel}</span>
          </div>
        )}

        {product.badge && !isOutOfStock ? (
          <div className="product-card__badge">{product.badge}</div>
        ) : null}

        {isOfferActive && product.offerLabel && !isOutOfStock ? (
          <div className="product-card__offer-label">{product.offerLabel}</div>
        ) : null}

        {isOutOfStock ? (
          <div className="product-card__sold-out-badge">AGOTADO</div>
        ) : null}

        {!isFeatured ? (
          <div className="product-card__overlay">
            <div className="product-card__actions">
              <button
                type="button"
                className="product-card__action-btn product-card__action-btn--primary"
                onClick={(event) => {
                  event.stopPropagation();
                  if (isOutOfStock) return;
                  if (hasSizes) {
                    onViewDetails?.(product);
                  } else {
                    onAddToCart?.(product);
                  }
                }}
                aria-label="Agregar al carrito"
                disabled={isOutOfStock}
              >
                <ShoppingCart size={18} />
                <span>{isOutOfStock ? "AGOTADO" : (hasSizes ? "OPCIONES" : "CARRITO")}</span>
              </button>

              <button
                type="button"
                className="product-card__action-btn product-card__action-btn--secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  onViewDetails?.(product);
                }}
                aria-label="Ver detalles"
              >
                <Info size={18} />
              </button>
            </div>
          </div>
        ) : null}

        {!isFeatured && hasStockInfo && stock > 0 && stock < 5 ? (
          <div className="product-card__stock-warning">POCO STOCK</div>
        ) : null}
      </div>

      <div className="product-card__content">
        <p className="product-card__category">
          {isFeatured ? product.category : product.specialty || product.category}
        </p>

        <h3 className="product-card__name">{product.name}</h3>

        {!isFeatured && product.sku ? (
          <p className="product-card__sku">SKU: {product.sku}</p>
        ) : null}

        {!isFeatured && hasStockInfo ? (
          <p
            className={`product-card__stock${
              stock < 5 ? " product-card__stock--low" : ""
            }${isOutOfStock ? " product-card__stock--sold-out" : ""}`}
          >
            {isOutOfStock ? "Sin stock" : `Stock: ${stock} unid.`}
          </p>
        ) : null}

        <div className="product-card__price-container">
          {isOfferActive && product.offerPrice ? (
            <>
              <span className="product-card__price product-card__price--offer">
                {`$${Number(product.offerPrice).toLocaleString("es-CL")}`}
              </span>
              <span className="product-card__price product-card__price--original">
                {product.price}
              </span>
            </>
          ) : (
            <p className="product-card__price">{product.price}</p>
          )}
        </div>
      </div>

      {isFeatured ? (
        <button
          type="button"
          className="product-card__cta"
          onClick={(event) => {
            event.stopPropagation();
            if (isOutOfStock || hasSizes) {
              onViewDetails?.(product);
              return;
            }
            onAddToCart?.(product);
          }}
        >
          <Zap size={16} />
          <span>{isOutOfStock ? "VER" : (hasSizes ? "OPCIONES" : "COMPRAR")}</span>
        </button>
      ) : null}
    </div>
  );
});
