import React, { useState, useEffect, useContext, useRef } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { AppContext } from "../../../context/AppContext";

export default function AllianceModal({ isOpen, onClose, editingItem }) {
  const { setAlliances, showNotification } = useContext(AppContext);
  const isEditing = !!editingItem;
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    nombre: "", tag: "", ubicacion: "", direccion: "", email: "", telefono: "", horario: "", dias: "", status: "partner", descripcion: "", imagen: "", instagram: "", website: ""
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing) setFormData({ ...editingItem });
      else setFormData({ nombre: "", tag: "", ubicacion: "", direccion: "", email: "", telefono: "", horario: "", dias: "", status: "partner", descripcion: "", imagen: "", instagram: "", website: "" });
    }
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imagen: reader.result }));
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return showNotification("Nombre requerido");

    setAlliances(prev => {
      if (isEditing) return prev.map(p => p.id === editingItem.id ? { ...p, ...formData } : p);
      return [...prev, { ...formData, id: Date.now().toString() }];
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h3 className="text-xl font-black italic uppercase text-white">{isEditing ? "Editar Alianza" : "Nueva Alianza"}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex gap-4 items-start">
            {formData.imagen ? (
              <div className="relative w-32 h-32 rounded-xl overflow-hidden shrink-0 group">
                <img src={formData.imagen} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, imagen: "" }))}
                  className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-600 hover:border-green-500 hover:text-green-500 transition-all shrink-0"
              >
                <Upload size={24} />
                <span className="text-[10px] font-black uppercase mt-2 text-center px-2">Subir Foto</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            
            <div className="flex-grow space-y-4">
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre de la Alianza / Centro" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-white uppercase" />
              <input type="text" name="tag" value={formData.tag} onChange={handleChange} placeholder="Etiqueta / Tipo (Ej: Gimnasio, Centro Médico)" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-white uppercase" />
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-white uppercase">
                <option value="partner">Partner Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} placeholder="Ciudad / Sector" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-white uppercase" />
            <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Dirección Exacta" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-white uppercase" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-white" />
            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Teléfono" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="text" name="horario" value={formData.horario} onChange={handleChange} placeholder="Horario (Ej: 08:00 a 22:00)" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-white uppercase" />
            <input type="text" name="dias" value={formData.dias} onChange={handleChange} placeholder="Días (Ej: Lunes a Viernes)" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-white uppercase" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="Instagram (Ej: @alianza)" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-white" />
            <input type="text" name="website" value={formData.website} onChange={handleChange} placeholder="Sitio Web" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-white" />
          </div>

          <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Descripción completa de la alianza..." className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-white h-24 resize-none" />
          
          <input type="text" name="imagen" value={formData.imagen} onChange={handleChange} placeholder="O ingresa la URL de la Imagen directamente" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-zinc-500" />
        </div>
        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-xl text-zinc-400 font-black uppercase text-xs">Cancelar</button>
          <button onClick={handleSubmit} className="px-6 py-3 rounded-xl bg-green-500 text-black font-black uppercase text-xs">Guardar</button>
        </div>
      </div>
    </div>
  );
}
