import React, { useContext, useState } from "react";
import { Users, Plus, Trash2, Edit } from "lucide-react";
import { AppContext } from "../../../context/AppContext";
import AllianceModal from "./AllianceModal";

export default function Alliances() {
  const { alliances, setAlliances } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlliance, setEditingAlliance] = useState(null);

  const handleDelete = (id) => {
    if (window.confirm("¿Eliminar alianza?")) {
      setAlliances(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleEdit = (alliance) => {
    setEditingAlliance(alliance);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingAlliance(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-zinc-950 p-6 rounded-2xl border border-zinc-900 shadow-xl">
        <div>
          <h3 className="text-2xl font-black italic uppercase text-white">Alianzas</h3>
        </div>
        <button onClick={handleNew} className="bg-white text-black px-6 py-2.5 rounded-xl font-black text-[10px] uppercase hover:bg-green-500 transition-all flex items-center gap-2">
          <Plus size={14} /> Nueva
        </button>
      </div>

      <div className="grid gap-4">
        {alliances.map(alliance => (
          <div key={alliance.id} className="glass p-5 rounded-[2rem] border border-zinc-800 flex items-center gap-6">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl overflow-hidden shrink-0">
              {alliance.imagen && <img src={alliance.imagen} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-grow">
              <h4 className="text-sm font-black uppercase italic text-white">{alliance.nombre}</h4>
              <p className="text-[10px] text-zinc-500 font-bold">{alliance.ubicacion}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleEdit(alliance)} className="bg-zinc-800 px-4 py-3 rounded-xl text-zinc-300 hover:text-white transition-all text-[10px] font-black uppercase">
                Editar
              </button>
              <button onClick={() => handleDelete(alliance.id)} className="bg-zinc-800/60 p-3 rounded-xl text-zinc-600 hover:text-red-500 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AllianceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editingItem={editingAlliance} />
    </div>
  );
}
