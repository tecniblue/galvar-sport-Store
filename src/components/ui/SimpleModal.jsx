import React from "react";
import { X } from "lucide-react";

export default function SimpleModal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col my-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-8 flex justify-between items-center border-b border-zinc-900 mb-4">
          <h2 className="text-2xl font-black uppercase text-white italic">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-8 pt-0">{children}</div>
      </div>
    </div>
  );
}
