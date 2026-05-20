import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { X, Upload, Trash2, Tag, Zap } from 'lucide-react';
import { useUIStore, useAuthStore, useCatalogStore, useCartStore } from "../../../store";
import { createProduct, updateProduct } from '../../../services/api';

export default function AdminProductModal({ isOpen, onClose, editingProduct }) {
  const setProducts = useCatalogStore(state => state.setProducts);
  const categories = useCatalogStore(state => state.categories);
  const fileInputRef = useRef(null);

  const categoryOptions = useMemo(() => {
    const opts = categories.filter((c) => c?.name && c.name !== "Todos");
    return opts.length ? opts : [{ name: "Boxeo", subcategories: [] }];
  }, [categories]);

  const BADGE_PRESETS = ["TOP", "Nuevo", "Limitado", "Oferta", "Exclusivo"];
  const SIZE_PRESETS = ["S", "M", "L", "XL", "8-oz", "10-oz", "12-oz", "14-oz", "16-oz"];

  const emptyProduct = useMemo(() => {
    const defaultCat = categoryOptions[0]?.name ?? "Boxeo";
    return {
      id: null,
      sku: "",
      label: "",
      badge: "",
      cat: defaultCat,
      subcat: "",
      price: "",
      variant: "",
      name: "",
      desc: "",
      stock: "",
      sizes: [],
      stockBySize: {},
      images: [],
      isFeatured: false,
      isWeeklyOffer: false,
      offerPrice: "",
      offerLabel: "",
      offerStartDate: "",
      offerEndDate: "",
      offerOrder: 0,
      featuredOrder: null,
    };
  }, [categoryOptions]);

  const initialFormData = useMemo(() => {
    if (!editingProduct) return emptyProduct;
    return {
      ...emptyProduct,
      ...editingProduct,
      price:
        editingProduct.price === null || editingProduct.price === undefined
          ? ""
          : String(editingProduct.price),
      stock:
        editingProduct.stock === null || editingProduct.stock === undefined
          ? ""
          : String(editingProduct.stock),
      badge: editingProduct.badge ?? "",
      sizes: Array.isArray(editingProduct.sizes) ? editingProduct.sizes : [],
      stockBySize: editingProduct.stockBySize || editingProduct.stock_by_size || {},
      images: Array.isArray(editingProduct.images) ? editingProduct.images : [],
      isWeeklyOffer: editingProduct.isWeeklyOffer || false,
      offerPrice: editingProduct.offerPrice === null || editingProduct.offerPrice === undefined ? "" : String(editingProduct.offerPrice),
      offerLabel: editingProduct.offerLabel ?? "",
      offerStartDate: editingProduct.offerStartDate ?? "",
      offerEndDate: editingProduct.offerEndDate ?? "",
      offerOrder: editingProduct.offerOrder ?? 0,
    };
  }, [editingProduct, emptyProduct]);

  const [formData, setFormData] = useState(() => initialFormData);

  // Sync form data when the modal opens with a new product
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
    }
     
  }, [isOpen, editingProduct?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const handleMultipleFiles = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addSizeVariant = (size) => {
    const s = String(size).trim().toUpperCase();
    if (!s) return;
    setFormData(prev => ({
      ...prev,
      sizes: [...new Set([...prev.sizes, s])],
      stockBySize: {
        ...prev.stockBySize,
        [s]: prev.stockBySize[s] || { stock: 0, sku: "", active: true }
      }
    }));
  };

  const removeSizeVariant = (size) => {
    setFormData(prev => {
      const nextStock = { ...prev.stockBySize };
      delete nextStock[size];
      return {
        ...prev,
        sizes: prev.sizes.filter(s => s !== size),
        stockBySize: nextStock
      };
    });
  };

  const updateVariantInfo = (size, field, value) => {
    setFormData(prev => ({
      ...prev,
      stockBySize: {
        ...prev.stockBySize,
        [size]: {
          ...prev.stockBySize[size],
          [field]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    const sku = formData.sku.trim();
    const name = formData.name.trim();
    if (!sku || !name) {
      alert("SKU y nombre son obligatorios.");
      return;
    }

    const priceNumber = Number(formData.price);
    const stockNumber = Number(formData.stock);
    const editingId = String(editingProduct?.id ?? "").trim();
    const formId = String(formData.id ?? "").trim();
    const productId = editingId || formId || String(Date.now());
    const hasExistingProductId = Boolean(editingId);
    const productToSave = {
      ...formData,
      id: productId,
      sku,
      label: formData.label.trim(),
      badge: formData.badge.trim(),
      name,
      variant: formData.variant.trim(),
      cat: formData.cat,
      subcat: formData.subcat || "",
      desc: formData.desc.trim(),
      isFeatured: formData.isFeatured || false,
      price: Number.isFinite(priceNumber) ? priceNumber : 0,
      stock: Number.isFinite(stockNumber) ? stockNumber : 0,
      sizes: Array.isArray(formData.sizes) ? formData.sizes : [],
      stockBySize: formData.stockBySize || {},
      images: Array.isArray(formData.images) ? formData.images : [],
      isWeeklyOffer: formData.isWeeklyOffer || false,
      offerPrice: formData.offerPrice === "" ? null : Number(formData.offerPrice),
      offerLabel: formData.offerLabel.trim(),
      offerStartDate: formData.offerStartDate || null,
      offerEndDate: formData.offerEndDate || null,
      offerOrder: Number(formData.offerOrder) || 0,
      featuredOrder: formData.featuredOrder ?? null,
    };

    try {
      if (hasExistingProductId) {
        await updateProduct(productToSave.id, productToSave);
      } else {
        await createProduct(productToSave);
      }

      setProducts(prev => {
        if (hasExistingProductId) {
          return prev.map((p) => (p.id === editingProduct.id ? productToSave : p));
        }
        return [...prev, productToSave];
      });
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error al guardar el producto.");
    }
  };

  const calculateDiscountInfo = () => {
    const original = Number(formData.price) || 0;
    const offer = Number(formData.offerPrice) || 0;
    if (original > 0 && offer > 0) {
      const pct = Math.round(((original - offer) / original) * 100);
      return pct;
    }
    return 0;
  };

  const handlePriceChange = (e) => {
    setFormData({ ...formData, price: e.target.value });
  };

  const handleOfferLabelChange = (val) => {
    const original = Number(formData.price) || 0;
    const cleanVal = val.replace(/[^0-9]/g, ""); // extract numbers
    const isPercentage = val.includes("%") || (!isNaN(cleanVal) && cleanVal.length > 0 && cleanVal.length <= 2);
    
    let nextPrice = formData.offerPrice;
    if (original > 0 && isPercentage && cleanVal) {
      const pct = Number(cleanVal);
      if (pct > 0 && pct < 100) {
        nextPrice = String(Math.round(original * (1 - pct / 100)));
      }
    }
    
    setFormData({ ...formData, offerLabel: val, offerPrice: nextPrice });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#0a0a0a] border border-zinc-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 flex justify-between items-center">
          <h2 className="text-2xl font-black uppercase text-white italic">Gestionar <span className="text-green-500">Producto</span></h2>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white"><X /></button>
        </div>

        <div className="p-8 pt-0 space-y-6">
          {/* Grid de imágenes subidas */}
          <div className="grid grid-cols-4 gap-2">
            {formData.images.map((img, idx) => (
              <div key={`img-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={img} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-600 hover:border-green-500 hover:text-green-500 transition-all"
            >
              <Upload size={20} />
              <span className="text-[8px] font-black uppercase mt-1">Añadir</span>
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" accept="image/*" onChange={handleMultipleFiles} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <input placeholder="SKU" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs uppercase" />
            <input placeholder="PRECIO" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs" />
            <input placeholder="STOCK" type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs" />
          </div>

          {/* Variantes / Tallas con Stock */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Tag size={12} className="text-zinc-500" />
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Gestión de Tallas / Variantes</p>
              </div>
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, sizes: [], stockBySize: {} })}
                className="text-[9px] font-bold text-zinc-600 hover:text-red-400 transition-colors uppercase tracking-tighter"
              >
                Limpiar todo
              </button>
            </div>

            <div className="flex gap-2">
              <select
                className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs uppercase flex-grow"
                onChange={(e) => {
                  addSizeVariant(e.target.value);
                  e.target.value = "";
                }}
                defaultValue=""
              >
                <option value="" disabled>Seleccionar preset...</option>
                {SIZE_PRESETS.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <input
                placeholder="Custom (Enter)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSizeVariant(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="w-1/3 bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs uppercase focus:border-green-500/50 outline-none transition-all"
              />
            </div>

            {formData.sizes.length > 0 && (
              <div className="space-y-2 border border-zinc-800 rounded-2xl p-4 bg-zinc-950/50">
                <div className="grid grid-cols-12 gap-2 pb-2 border-b border-zinc-900">
                  <div className="col-span-3 text-[8px] font-black text-zinc-600 uppercase tracking-widest">Talla</div>
                  <div className="col-span-3 text-[8px] font-black text-zinc-600 uppercase tracking-widest text-center">Stock</div>
                  <div className="col-span-4 text-[8px] font-black text-zinc-600 uppercase tracking-widest">SKU Variantes</div>
                  <div className="col-span-2 text-[8px] font-black text-zinc-600 uppercase tracking-widest text-right">Acción</div>
                </div>
                
                {formData.sizes.map((size) => {
                  const info = formData.stockBySize[size] || { stock: 0, sku: "", active: true };
                  return (
                    <div key={size} className="grid grid-cols-12 gap-2 items-center py-2 border-b border-zinc-900/50 last:border-0">
                      <div className="col-span-3">
                        <span className="text-[10px] font-black text-white uppercase">{size}</span>
                      </div>
                      <div className="col-span-3 flex justify-center">
                        <input
                          type="number"
                          value={info.stock}
                          onChange={(e) => updateVariantInfo(size, 'stock', Number(e.target.value))}
                          className="w-16 bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg text-[10px] text-center text-green-500 font-bold"
                          placeholder="0"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={info.sku}
                          onChange={(e) => updateVariantInfo(size, 'sku', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg text-[9px] uppercase text-zinc-400"
                          placeholder="SKU-OPC"
                        />
                      </div>
                      <div className="col-span-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => removeSizeVariant(size)}
                          className="p-1.5 text-zinc-600 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              value={formData.cat}
              onChange={(e) => setFormData({ ...formData, cat: e.target.value, subcat: "" })}
              className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs uppercase"
            >
              {categoryOptions.map((catObj) => (
                <option key={catObj.name} value={catObj.name}>
                  {catObj.name}
                </option>
              ))}
            </select>
            <select
              value={formData.subcat}
              onChange={(e) => setFormData({ ...formData, subcat: e.target.value })}
              className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs uppercase"
            >
              <option value="">SIN SUBCATEGORÍA</option>
              {(categoryOptions.find(c => c.name === formData.cat)?.subcategories || []).map((subcat) => (
                <option key={subcat} value={subcat}>
                  {subcat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <input placeholder="NOMBRE" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs uppercase" />
            <input
              placeholder="VARIANTE / DISEÑO"
              value={formData.variant}
              onChange={(e) =>
                setFormData({ ...formData, variant: e.target.value })
              }
              className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs uppercase"
            />
            <input
              placeholder="ETIQUETA (EJ: GS)"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs uppercase"
            />
          </div>
          <textarea placeholder="DESCRIPCIÓN" value={formData.desc} onChange={e => setFormData(prev => ({ ...prev, desc: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs h-24 resize-none text-white" />

          {/* Badge / Etiqueta visual del producto */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Tag size={12} className="text-zinc-500" />
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Etiqueta del producto</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {BADGE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFormData({ ...formData, badge: formData.badge === preset ? "" : preset })}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${formData.badge === preset
                      ? "bg-amber-500 border-amber-400 text-black"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-amber-500/50 hover:text-amber-400"
                    }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              placeholder="O escribe una etiqueta personalizada…"
              value={BADGE_PRESETS.includes(formData.badge) ? "" : formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs uppercase focus:border-amber-500/50 outline-none transition-all"
            />
            {formData.badge && (
              <div className="flex items-center gap-2">
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Vista previa:</p>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500 text-black">{formData.badge}</span>
                <button type="button" onClick={() => setFormData({ ...formData, badge: "" })} className="text-[9px] font-bold text-zinc-600 hover:text-red-400 transition-colors">Limpiar</button>
              </div>
            )}
          </div>

          <div className="pt-2 space-y-4">
            <label className="flex items-center gap-3 text-xs uppercase text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured || false}
                onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="bg-zinc-900 border-zinc-700 rounded text-green-500 focus:ring-green-500"
              />
              Marcar como producto destacado
            </label>

            <div className="border-t border-zinc-900 pt-6 space-y-4">
               <label className="flex items-center gap-3 text-xs uppercase text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isWeeklyOffer || false}
                  onChange={e => setFormData({ ...formData, isWeeklyOffer: e.target.checked })}
                  className="bg-zinc-900 border-zinc-700 rounded text-yellow-500 focus:ring-yellow-500"
                />
                <span className="flex items-center gap-2">
                  <Zap size={14} className="text-yellow-400" />
                  Activar Oferta de la Semana
                </span>
              </label>

              {formData.isWeeklyOffer && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Precio Oferta</label>
                    <input 
                      type="number" 
                      placeholder="PRECIO OFERTA" 
                      value={formData.offerPrice} 
                      onChange={e => {
                        const val = e.target.value;
                        const original = Number(formData.price) || 0;
                        const offer = Number(val) || 0;
                        let label = formData.offerLabel;
                        if (original > 0 && offer > 0) {
                          const pct = Math.round(((original - offer) / original) * 100);
                          label = `-${pct}%`;
                        }
                        setFormData({ ...formData, offerPrice: val, offerLabel: label });
                      }} 
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs text-yellow-400 font-black outline-none focus:border-yellow-500/50" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Etiqueta / % Descuento</label>
                    <input 
                      type="text" 
                      placeholder="Escribe % o texto (ej: 20%)" 
                      value={formData.offerLabel} 
                      onChange={e => handleOfferLabelChange(e.target.value)} 
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs uppercase outline-none focus:border-yellow-500/50" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Fecha Inicio</label>
                    <input 
                      type="date" 
                      value={formData.offerStartDate ? formData.offerStartDate.split('T')[0] : ""} 
                      onChange={e => setFormData({ ...formData, offerStartDate: e.target.value })} 
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs outline-none focus:border-yellow-500/50" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Fecha Término</label>
                    <input 
                      type="date" 
                      value={formData.offerEndDate ? formData.offerEndDate.split('T')[0] : ""} 
                      onChange={e => setFormData({ ...formData, offerEndDate: e.target.value })} 
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs outline-none focus:border-yellow-500/50" 
                    />
                  </div>
                </div>
              )}
            </div>

            <button type="button" onClick={handleSave} className="w-full bg-green-500 text-black py-4 rounded-2xl font-black uppercase italic shadow-xl shadow-green-500/20 hover:bg-white transition-colors">
              GUARDAR CAMBIOS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
