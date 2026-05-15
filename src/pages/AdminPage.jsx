import React, { useState } from "react";
import { Package, Shield, Users, ShoppingBag, Zap } from "lucide-react";
import AdminAccessGate from "../features/admin/shared/AdminAccessGate";
import AdminLayout from "../features/admin/shared/AdminLayout";
import Inventory from "../features/admin/inventory/Inventory";
import Alliances from "../features/admin/alliances/Alliances";
import Fighters from "../features/admin/fighters/Fighters";
import Orders from "../features/admin/orders/Orders";
import OffersManager from "../features/admin/offers/OffersManager";

const TABS = [
  { id: "inventario", label: "Inventario", icon: Package },
  { id: "alianzas", label: "Alianzas", icon: Shield },
  { id: "guerreros", label: "Guerreros", icon: Users },
  { id: "ofertas", label: "Ofertas", icon: Zap },
  { id: "ordenes", label: "Órdenes", icon: ShoppingBag },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("inventario");

  return (
    <AdminAccessGate>
      <AdminLayout
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <div className="grid lg:grid-cols-3 gap-10">
          <div className={`${activeTab === "inventario" ? "block" : "hidden"} lg:col-span-3`}>
            <Inventory />
          </div>

          <div className={`${activeTab === "alianzas" ? "block" : "hidden"} lg:col-span-3`}>
            <Alliances />
          </div>
          <div className={`${activeTab === "guerreros" ? "block" : "hidden"} lg:col-span-3`}>
            <Fighters />
          </div>
          <div className={`${activeTab === "ordenes" ? "block" : "hidden"} lg:col-span-3`}>
            <Orders />
          </div>
          <div className={`${activeTab === "ofertas" ? "block" : "hidden"} lg:col-span-3`}>
            <OffersManager />
          </div>
        </div>
      </AdminLayout>
    </AdminAccessGate>
  );
}
