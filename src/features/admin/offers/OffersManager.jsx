import React, { useContext, useState } from "react";
import { useUIStore, useAuthStore, useCatalogStore, useCartStore } from "../../../store";
import { Zap, Save, Plus, Trash2, Calendar, Tag, DollarSign, Loader2 } from "lucide-react";
import { updateProduct } from "../../../services/api";

export default function OffersManager() {
  const products = useCatalogStore(state => state.products);
  const setProducts = useCatalogStore(state => state.setProducts);
  const showNotification = useUIStore(state => state.showNotification);
  const showError = useUIStore(state => state.showError);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  const weeklyOffers = products.filter(p => p.isWeeklyOffer);
  const nonOffers = products.filter(p => !p.isWeeklyOffer);

  const handleToggleOffer = async (product) => {
    const nextProduct = { ...product, isWeeklyOffer: !product.isWeeklyOffer, offerOrder: product.offerOrder || 0 };
    try {
      setPendingId(`toggle:${product.id}`);
      await updateProduct(product.id, nextProduct);
      setProducts(prev => prev.map(p => p.id === product.id ? nextProduct : p));
      showNotification(product.isWeeklyOffer ? "Oferta eliminada" : "Producto añadido a ofertas");
    } catch(e) { console.error(e); showError("Error al actualizar oferta"); }
    finally { setPendingId(null); }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setDraft({ ...product });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = async () => {
    try {
      setPendingId(`save:${draft.id}`);
      await updateProduct(draft.id, draft);
      setProducts(prev => prev.map(p => p.id === draft.id ? draft : p));
      setEditingId(null);
      setDraft(null);
      showNotification("Oferta actualizada correctamente");
    } catch(e) { console.error(e); showError("Error al guardar oferta"); }
    finally { setPendingId(null); }
  };

  const handleChange = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const handleOfferLabelChange = (val) => {
    const original = Number(draft.price) || 0;
    const cleanVal = val.replace(/[^0-9]/g, ""); // extract numbers
    const isPercentage = val.includes("%") || (!isNaN(cleanVal) && cleanVal.length > 0 && cleanVal.length <= 2);
    
    let nextPrice = draft.offerPrice;
    if (original > 0 && isPercentage && cleanVal) {
      const pct = Number(cleanVal);
      if (pct > 0 && pct < 100) {
        nextPrice = String(Math.round(original * (1 - pct / 100)));
      }
    }
    
    setDraft(prev => ({ ...prev, offerLabel: val, offerPrice: nextPrice }));
  };

  const calculateDiscountPct = (p) => {
    const original = Number(p.price) || 0;
    const offer = Number(p.offerPrice) || 0;
    if (original > 0 && offer > 0) {
      return Math.round(((original - offer) / original) * 100);
    }
    return 0;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
            Ofertas de la <span className="text-yellow-400">Semana</span>
          </h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
            Gestiona los productos destacados en el banner de promociones
          </p>
        </div>
      </header>

      {/* Ofertas Activas */}
      <div className="glass border border-zinc-900 rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-zinc-900 bg-zinc-900/20 flex items-center gap-3">
          <Zap size={18} className="text-yellow-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Ofertas Activas ({weeklyOffers.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Precio Oferta</th>
                <th className="px-6 py-4">Etiqueta</th>
                <th className="px-6 py-4">Fechas</th>
                <th className="px-6 py-4">Orden</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {weeklyOffers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
                    No hay ofertas activas. Selecciona productos abajo.
                  </td>
                </tr>
              ) : (
                weeklyOffers.map(p => {
                  const isEditing = editingId === p.id;
                  const item = isEditing ? draft : p;

                  return (
                    <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0">
                            {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase text-white truncate max-w-[150px]">{p.name}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Orig: ${Number(p.price).toLocaleString("es-CL")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="relative">
                            <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input 
                              type="number"
                              value={item.offerPrice || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                const original = Number(draft.price) || 0;
                                const offer = Number(val) || 0;
                                let label = draft.offerLabel;
                                if (original > 0 && offer > 0) {
                                  const pct = Math.round(((original - offer) / original) * 100);
                                  label = `-${pct}%`;
                                }
                                setDraft(prev => ({ ...prev, offerPrice: val, offerLabel: label }));
                              }}
                              className="bg-zinc-900 border border-zinc-800 rounded-lg px-7 py-1.5 text-xs text-white w-28 focus:border-yellow-500/50 outline-none"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-black text-yellow-400">${Number(p.offerPrice || 0).toLocaleString("es-CL")}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="relative">
                            <Tag size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input 
                              type="text"
                              value={item.offerLabel || ""}
                              onChange={(e) => handleOfferLabelChange(e.target.value)}
                              placeholder="Ej: 20%"
                              className="bg-zinc-900 border border-zinc-800 rounded-lg px-7 py-1.5 text-xs text-white w-32 focus:border-yellow-500/50 outline-none"
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] font-black uppercase bg-red-500/10 text-red-500 px-2 py-1 rounded-md">{p.offerLabel || "OFERTA"}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-1">
                               <input 
                                type="date"
                                value={item.offerStartDate ? item.offerStartDate.split('T')[0] : ""}
                                onChange={(e) => handleChange("offerStartDate", e.target.value)}
                                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[10px] text-white outline-none flex-grow"
                              />
                              {item.offerStartDate && (
                                <button onClick={() => handleChange("offerStartDate", null)} className="text-zinc-600 hover:text-red-500">
                                  <Trash2 size={10} />
                                </button>
                              )}
                             </div>
                             <div className="flex items-center gap-1">
                               <input 
                                type="date"
                                value={item.offerEndDate ? item.offerEndDate.split('T')[0] : ""}
                                onChange={(e) => handleChange("offerEndDate", e.target.value)}
                                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[10px] text-white outline-none flex-grow"
                              />
                              {item.offerEndDate && (
                                <button onClick={() => handleChange("offerEndDate", null)} className="text-zinc-600 hover:text-red-500">
                                  <Trash2 size={10} />
                                </button>
                              )}
                             </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-zinc-500">
                            <Calendar size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">
                              {p.offerEndDate ? new Date(p.offerEndDate).toLocaleDateString() : "Indefinida"}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                           <input 
                            type="number"
                            value={item.offerOrder || 0}
                            onChange={(e) => handleChange("offerOrder", e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white w-16 outline-none"
                          />
                        ) : (
                          <span className="text-xs font-bold text-zinc-400">{p.offerOrder || 0}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button 
                                onClick={saveEdit}
                                disabled={pendingId === `save:${p.id}`}
                                className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500 hover:text-black transition-all"
                              >
                                {pendingId === `save:${p.id}` ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                              </button>
                              <button 
                                onClick={cancelEdit}
                                className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-all"
                              >
                                <Plus size={16} className="rotate-45" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => startEdit(p)}
                                className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-lg hover:border-yellow-500/50 hover:text-yellow-400 transition-all"
                              >
                                <Plus size={16} className="rotate-45 rotate-[-45deg]" />
                              </button>
                              <button 
                                onClick={() => handleToggleOffer(p)}
                                disabled={pendingId === `toggle:${p.id}`}
                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-black transition-all"
                              >
                                {pendingId === `toggle:${p.id}` ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selector de Productos */}
      <div className="glass border border-zinc-900 rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between">
           <div className="flex items-center gap-3">
            <Plus size={18} className="text-green-500" />
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Añadir a Ofertas</h3>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          {nonOffers.map(p => (
            <div key={p.id} className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center gap-4 group hover:border-green-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex-shrink-0">
                {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-[10px] font-black uppercase text-white truncate">{p.name}</p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">${Number(p.price).toLocaleString("es-CL")}</p>
              </div>
              <button 
                onClick={() => handleToggleOffer(p)}
                disabled={pendingId === `toggle:${p.id}`}
                className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-black transition-all"
              >
                {pendingId === `toggle:${p.id}` ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
