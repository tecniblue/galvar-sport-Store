import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, ShoppingBag, Phone, Mail, MapPin, Store, CreditCard, MessageSquare, Clock, CheckCircle2, XCircle, Truck, PackageCheck, Search, Download, Hash, ChevronRight, ArrowLeft, TrendingUp } from "lucide-react";
import { fetchOrders, updateOrderStatus, deleteOrder } from "../../../services/api";
import { useUIStore, useAuthStore, useCatalogStore, useCartStore } from "../../../store";

// Valid forward transitions per status
const ALLOWED_TRANSITIONS = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped:   ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const CONFIRM_BEFORE = {
  completed: "¿Marcar como completado? Esta acción es definitiva.",
  cancelled: "¿Cancelar esta orden? No se puede deshacer.",
};

const fmt = (v) => { const n = Number(v); return Number.isFinite(n) ? n.toLocaleString("es-CL") : "0"; };
const fmtDate = (s) => { if (!s) return "-"; const d = new Date(s); return d.toLocaleString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); };
const fmtNum = (n) => `#${String(n ?? "?").padStart(4, "0")}`;
const waLink = (o) => {
  const p = String(o.customer_phone ?? "").replace(/[^+\d]/g, "");
  if (!p) return null;
  const n = fmtNum(o.order_number);
  const msg = `Hola ${o.customer_name ?? ""}! Recibimos tu pedido ${n} por $${fmt(o.total)} en Galvar Sport. ¿Confirmamos?`;
  return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
};
const fulfillmentLabel = (value) => ({
  pickup: "Retiro en tienda",
  delivery: "Delivery local",
  chilexpress: "Chilexpress",
}[value] ?? (value || "No informado"));
const fulfillmentShortLabel = (value) => ({
  pickup: "Retiro",
  delivery: "Delivery",
  chilexpress: "Chilexpress",
}[value] ?? (value || "Entrega"));
const paymentLabel = (value) => ({
  whatsapp: "Coordinacion WhatsApp",
  card: "Tarjeta",
  transfer: "Transferencia",
}[value] ?? (value || "No informado"));
const itemQty = (item) => Number(item?.qty ?? item?.quantity ?? 1) || 1;
const resolveImg = (item, products) => {
  if (item.image) return item.image;
  const p = products?.find(p => p.id === item.id);
  return p?.images?.[0] ?? "";
};

const exportCsv = (orders) => {
  const h = ["Nro","Fecha","Cliente","Telefono","Email","RUT","Comuna/Region","Entrega","Pago","Estado","Total","Direccion","Notas"];
  const rows = orders.map(o => [o.order_number ?? "", fmtDate(o.created_at), o.customer_name ?? "", o.customer_phone ?? "", o.customer_email ?? "", o.rut ?? "", o.comuna_region ?? "", fulfillmentLabel(o.fulfillment), paymentLabel(o.payment_method), o.status ?? "", o.total ?? 0, o.address ?? "", o.notes ?? ""]);
  const csv = [h, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })); a.download = `ordenes-${new Date().toISOString().slice(0,10)}.csv`; a.click();
};

const SC = {
  pending:   { label: "Pendiente",  color: "text-amber-400 border-amber-500/30 bg-amber-500/10",    bar: "bg-amber-400",   icon: Clock },
  confirmed: { label: "Confirmado", color: "text-blue-400 border-blue-500/30 bg-blue-500/10",      bar: "bg-blue-400",    icon: CheckCircle2 },
  shipped:   { label: "En camino",  color: "text-purple-400 border-purple-500/30 bg-purple-500/10", bar: "bg-purple-400",  icon: Truck },
  completed: { label: "Completado", color: "text-green-400 border-green-500/30 bg-green-500/10",   bar: "bg-green-400",   icon: PackageCheck },
  cancelled: { label: "Cancelado",  color: "text-red-400 border-red-500/30 bg-red-500/10",         bar: "bg-red-400",     icon: XCircle },
};
const FLOW = ["pending","confirmed","shipped","completed"];

function Badge({ status }) {
  const c = SC[status] ?? SC.pending; const I = c.icon;
  return <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${c.color}`}><I size={10} />{c.label}</span>;
}

function Timeline({ status }) {
  const idx = FLOW.indexOf(status);
  return (
    <div className="flex items-center gap-0">
      {FLOW.map((s, i) => {
        const done = idx >= i; const C = SC[s];
        return (
          <React.Fragment key={s}>
            <div className={`flex flex-col items-center gap-1`}>
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${done ? `${C.bar} border-transparent` : "border-zinc-700 bg-zinc-900"}`}>
                {done ? <CheckCircle2 size={13} className="text-black" /> : <div className="w-2 h-2 rounded-full bg-zinc-700" />}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-wide whitespace-nowrap ${done ? "text-white" : "text-zinc-600"}`}>{C.label}</span>
            </div>
            {i < FLOW.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${idx > i ? C.bar : "bg-zinc-800"}`} style={{ minWidth: 16 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function OrderDetail({ order, onStatusChange, onDelete, onBack, products }) {
  const [updating, setUpdating] = useState(false);
  const wa = useMemo(() => waLink(order), [order]);
  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];

  const change = async (s) => {
    if (updating || !allowed.includes(s)) return;
    const confirmMsg = CONFIRM_BEFORE[s];
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setUpdating(true);
    try { await onStatusChange(order.id, s); } finally { setUpdating(false); }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button type="button" onClick={onBack} className="lg:hidden w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
            <ArrowLeft size={14} />
          </button>
          <div className="flex-grow">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl font-black text-white">{fmtNum(order.order_number)}</span>
              <Badge status={order.status} />
              {/* Delivery method badge */}
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                order.fulfillment !== "pickup"
                  ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                  : "text-zinc-400 border-zinc-700 bg-zinc-800/50"
              }`}>
                {order.fulfillment !== "pickup" ? <Truck size={10}/> : <Store size={10}/>}
                {fulfillmentLabel(order.fulfillment)}
              </span>
            </div>
            <p className="text-[10px] font-bold text-zinc-600 mt-0.5">{fmtDate(order.created_at)}</p>
          </div>
        </div>
        <Timeline status={order.status} />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Customer */}
        <div className="glass rounded-2xl border border-zinc-800 p-5 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cliente</p>
        <p className="text-[12px] font-black uppercase text-white truncate">{order.customer_name || "-"}</p>
          <div className="space-y-2">
            {order.customer_phone && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2"><Phone size={12} className="text-green-500"/><span className="text-[11px] font-bold text-zinc-300">{order.customer_phone}</span></div>
                {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[9px] font-black uppercase text-green-500 border border-green-500/30 px-2.5 py-1 rounded-lg hover:bg-green-500/10 transition-all"><MessageSquare size={10}/>Contactar</a>}
              </div>
            )}
            {order.customer_email && <div className="flex items-center gap-2"><Mail size={12} className="text-green-500"/><span className="text-[11px] font-bold text-zinc-300">{order.customer_email}</span></div>}
            {order.fulfillment !== "pickup" && order.address
              ? <div className="flex items-start gap-2"><MapPin size={12} className="text-green-500 mt-0.5 shrink-0"/><span className="text-[11px] font-bold text-zinc-300">{order.address}</span></div>
              : <div className="flex items-center gap-2"><Store size={12} className="text-green-500"/><span className="text-[11px] font-bold text-zinc-300">Retiro en tienda - Antofagasta</span></div>}
            {order.rut && <div className="flex items-center gap-2"><Hash size={12} className="text-green-500"/><span className="text-[11px] font-bold text-zinc-300">RUT: {order.rut}</span></div>}
            {order.comuna_region && <div className="flex items-center gap-2"><MapPin size={12} className="text-green-500"/><span className="text-[11px] font-bold text-zinc-300">Comuna/Region: {order.comuna_region}</span></div>}
            <div className="flex items-center gap-2">
              {order.payment_method === "whatsapp" ? <MessageSquare size={12} className="text-green-500"/> : <CreditCard size={12} className="text-green-500"/>}
              <span className="text-[11px] font-bold text-zinc-300">{paymentLabel(order.payment_method)}</span>
            </div>
          </div>
          {order.notes && <p className="text-[10px] font-bold text-zinc-500 italic border-l-2 border-zinc-700 pl-3 mt-2">"{order.notes}"</p>}
        </div>

        {/* Products */}
        <div className="glass rounded-2xl border border-zinc-800 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Productos</p>
          <div className="space-y-3">
            {(order.items ?? []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {/* Image */}
                <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {(() => { const img = resolveImg(item, products); return img
                    ? <img src={img} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                    : <span className="text-[9px] font-black text-zinc-600 uppercase">{item.label || "GS"}</span>; })()
                  }
                </div>
                {/* Info */}
                <div className="flex-grow min-w-0">
                  <p className="text-[11px] font-black uppercase text-white truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {item.sku && <span className="text-[9px] font-bold text-green-500 uppercase">#{item.sku}</span>}
                    {item.variant && <span className="text-[9px] font-bold text-zinc-500">{item.variant}</span>}
                    {item.size && <span className="text-[9px] font-black text-amber-500 uppercase">Talla: {item.size}</span>}
                    <span className="text-[9px] font-bold text-zinc-600">x{itemQty(item)}</span>
                  </div>
                </div>
                {/* Price */}
                <div className="text-right shrink-0">
                  <p className="text-[12px] font-black text-green-500 tabular-nums">${fmt((item.price ?? 0) * itemQty(item))}</p>
                  <p className="text-[9px] text-zinc-600 tabular-nums">${fmt(item.price)} c/u</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total pedido</span>
            <span className="text-2xl font-black text-white tabular-nums">${fmt(order.total)}</span>
          </div>
        </div>

        <div className="glass rounded-2xl border border-zinc-800 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Cambiar estado</p>
          {allowed.length === 0 ? (
            <div className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border text-center ${
              order.status === "completed" ? SC.completed.color : SC.cancelled.color
            }`}>
              {order.status === "completed" ? "Orden finalizada" : "Orden cancelada"} - estado bloqueado
            </div>
          ) : (
            <div className="space-y-2">
              {allowed.map(s => {
                const cfg = SC[s];
                const isDanger = s === "cancelled";
                return (
                  <button key={s} type="button" disabled={updating} onClick={() => change(s)}
                    className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      isDanger
                        ? "border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10"
                        : "border-green-500/30 text-green-400 bg-green-500/5 hover:bg-green-500/10"
                    } disabled:opacity-50`}>
                    {isDanger ? `Cancelar: ${cfg.label}` : `Avanzar: ${cfg.label}`}
                  </button>
                );
              })}
            </div>
          )}
          <button type="button" disabled={updating} onClick={() => onDelete(order.id)}
            className="w-full mt-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-all disabled:opacity-50">
            Eliminar Orden Permanentemente
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order, isSelected, onClick, products }) {
  const firstImg = resolveImg(order.items?.[0] ?? {}, products);
  const cfg = SC[order.status] ?? SC.pending;
  const isShipping = order.fulfillment !== "pickup";
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-4 py-4 flex items-center gap-4 border-b transition-all ${isSelected ? "bg-green-500/5 border-b-green-500/20" : "border-b-zinc-900 hover:bg-zinc-900/40"}`}>
      {/* Thumb */}
      <div className="relative w-12 h-12 shrink-0">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center">
          {firstImg ? <img src={firstImg} alt="" className="w-full h-full object-cover opacity-90" loading="lazy"/> : <ShoppingBag size={16} className="text-zinc-600"/>}
        </div>
        {order.items?.length > 1 && <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[8px] font-black text-zinc-400">+{order.items.length - 1}</div>}
      </div>
      {/* Info */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-black text-zinc-500 tabular-nums">{fmtNum(order.order_number)}</span>
          <div className={`w-1.5 h-1.5 rounded-full ${cfg.bar}`} />
          {/* Delivery method inline */}
          <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-0.5 ${isShipping ? "text-blue-400" : "text-zinc-600"}`}>
            {isShipping ? <Truck size={9}/> : <Store size={9}/>}
            {fulfillmentShortLabel(order.fulfillment)}
          </span>
        </div>
        <p className="text-[12px] font-black uppercase text-white truncate">{order.customer_name || "-"}</p>
        <p className="text-[9px] font-bold text-zinc-600 mt-0.5">{fmtDate(order.created_at)}</p>
      </div>
      {/* Right */}
      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
        <span className="text-[13px] font-black text-white tabular-nums">${fmt(order.total)}</span>
        <Badge status={order.status} />
      </div>
      <ChevronRight size={14} className={`shrink-0 transition-colors ${isSelected ? "text-green-500" : "text-zinc-700"}`} />
    </button>
  );
}

export default function Orders() {
  const showNotification = useUIStore(state => state.showNotification);
  const products = useCatalogStore(state => state.products);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const refreshRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders();
      const list = Array.isArray(data) ? data : [];
      setOrders(list);
      setSelected(prev => prev ? (list.find(o => o.id === prev.id) ?? prev) : null);
    } catch { if (!silent) setError("No se pudieron cargar las órdenes."); }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const hasPending = orders.some(o => o.status === "pending");
    if (hasPending) refreshRef.current = setInterval(() => load(true), 30_000);
    return () => clearInterval(refreshRef.current);
  }, [orders, load]);

  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updated } : o));
      setSelected(prev => prev?.id === orderId ? { ...prev, ...updated } : prev);
      showNotification?.(
        updated.statusEmailSent
          ? `Estado actualizado y cliente notificado: ${SC[newStatus]?.label}`
          : `Estado actualizado: ${SC[newStatus]?.label}`,
      );
    } catch { showNotification?.("Error al actualizar."); }
  }, [showNotification]);

  const handleDeleteOrder = useCallback(async (orderId) => {
    if (!window.confirm("¿Estás 100% seguro de que deseas ELIMINAR esta orden por completo de la base de datos? Esto no se puede deshacer.")) return;
    try {
      await deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (selected?.id === orderId) {
        setSelected(null);
        setShowDetail(false);
      }
      showNotification?.("Orden eliminada permanentemente.");
    } catch { showNotification?.("Error al eliminar la orden."); }
  }, [selected, showNotification]);

  const filtered = useMemo(() => {
    let r = orders;
    if (filterStatus !== "all") r = r.filter(o => o.status === filterStatus);
    const q = search.trim().toLowerCase();
    if (q) r = r.filter(o => String(o.customer_name ?? "").toLowerCase().includes(q) || String(o.customer_phone ?? "").includes(q) || String(o.order_number ?? "").includes(q));
    return r;
  }, [orders, filterStatus, search]);

  const counts = useMemo(() => { const c = { all: orders.length }; Object.keys(SC).forEach(s => { c[s] = orders.filter(o => o.status === s).length; }); return c; }, [orders]);
  const revenue = useMemo(() => orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (Number(o.total) || 0), 0), [orders]);
  const avgOrder = counts.all > 0 ? revenue / counts.all : 0;
  const hasPending = (counts.pending ?? 0) > 0;

  const selectOrder = (o) => { setSelected(o); setShowDetail(true); };
  const closeDetail = () => setShowDetail(false);

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "calc(100vh - 200px)" }}>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total órdenes", value: counts.all, sub: `${counts.completed ?? 0} completadas`, color: "border-zinc-800" },
          { label: "Pendientes", value: counts.pending ?? 0, sub: hasPending ? "Auto-refresh activo" : "Sin nuevas", color: hasPending ? "border-amber-500/40 bg-amber-500/5" : "border-zinc-800" },
          { label: "Ingresos", value: `$${fmt(revenue)}`, sub: `Avg $${fmt(avgOrder)}`, color: "border-green-500/20 bg-green-500/5" },
          { label: "En camino", value: counts.shipped ?? 0, sub: `${counts.confirmed ?? 0} confirmados`, color: "border-zinc-800" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className={`glass rounded-2xl border p-4 ${color}`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
            <p className="text-2xl font-black text-white mt-1 tabular-nums">{value}</p>
            <p className="text-[9px] font-bold text-zinc-600 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-grow">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre, teléfono, # orden..." className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-white outline-none focus:border-green-500/50 transition-all placeholder:text-zinc-700"/>
        </div>
        <button type="button" onClick={() => exportCsv(filtered)} disabled={!filtered.length} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-30">
          <Download size={13}/>CSV
        </button>
        <button type="button" onClick={() => load()} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""}/>Sync
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[["all", `Todas (${counts.all})`], ...Object.entries(SC).map(([s, c]) => [s, `${c.label} (${counts[s] ?? 0})`])].map(([s, label]) => (
          <button key={s} type="button" onClick={() => setFilterStatus(s)}
            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterStatus === s ? (s === "all" ? "bg-white text-black border-white" : SC[s]?.color) : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Split panel */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center glass rounded-[2rem] border border-zinc-900 py-20">
          <RefreshCw size={28} className="text-green-500 animate-spin mb-4"/>
          <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Cargando órdenes...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center glass rounded-[2rem] border border-red-500/20 py-16">
          <p className="text-[11px] font-black uppercase text-red-400 mb-4">{error}</p>
          <button type="button" onClick={() => load()} className="px-6 py-2 rounded-xl border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all">Reintentar</button>
        </div>
      ) : (
        <div className="flex-1 glass rounded-[2rem] border border-zinc-800 overflow-hidden flex">
          {/* List panel */}
          <div className={`flex flex-col ${showDetail ? "hidden lg:flex" : "flex"} ${selected ? "lg:w-[42%]" : "w-full"} border-r border-zinc-800`}>
            {filtered.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-60">
                <ShoppingBag size={32} className="text-zinc-700 mb-3"/>
                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-600">{search ? "Sin resultados" : "Sin órdenes"}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {filtered.map(o => (
                  <OrderRow key={o.id} order={o} isSelected={selected?.id === o.id} onClick={() => selectOrder(o)} products={products}/>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected ? (
            <div className={`flex-1 flex flex-col ${showDetail ? "flex" : "hidden lg:flex"}`}>
              <OrderDetail
                order={selected}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteOrder}
                onBack={closeDetail}
                products={products}
              />
            </div>
          ) : (
            <div className="hidden lg:flex flex-1 flex-col items-center justify-center opacity-40">
              <TrendingUp size={36} className="text-zinc-700 mb-3"/>
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-600">Selecciona una orden</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
