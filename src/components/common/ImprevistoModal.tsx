import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ImprevistoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string, tempoPerdido: number, adiarTodas: boolean) => void;
}

export function ImprevistoModal({ isOpen, onClose, onConfirm }: ImprevistoModalProps) {
  const [motivo, setMotivo] = useState('');
  const [tempoPerdido, setTempoPerdido] = useState(30);
  const [adiarTodas, setAdiarTodas] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up border border-error/20">
        <div className="flex justify-between items-center p-6 border-b border-border-subtle sticky top-0 bg-bg-card/95 backdrop-blur-sm z-10">
          <h2 className="text-xl font-bold text-error flex items-center gap-2 tracking-tight">
            <AlertTriangle size={24} />
            Imprevisto Detectado
          </h2>
          <button onClick={onClose} className="text-text-sec hover:text-white transition-colors p-2 hover:bg-bg-sec rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-sec">O que aconteceu?</label>
            <input 
              type="text" 
              value={motivo} 
              onChange={(e) => setMotivo(e.target.value)} 
              className="input-modern focus:border-error focus:ring-1 focus:ring-error"
              placeholder="Ex: Reunião de última hora"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-text-sec">Tempo perdido (minutos)</label>
            <input 
              type="number" 
              value={tempoPerdido} 
              onChange={(e) => setTempoPerdido(Number(e.target.value))} 
              className="input-modern focus:border-error focus:ring-1 focus:ring-error"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-bg-sec rounded-xl border border-border-subtle">
            <input 
              type="checkbox" 
              checked={adiarTodas} 
              onChange={(e) => setAdiarTodas(e.target.checked)} 
              id="adiarTodas"
              className="w-4 h-4 text-error bg-bg-main border-border-subtle rounded focus:ring-error focus:ring-offset-bg-card"
            />
            <label htmlFor="adiarTodas" className="text-sm text-text-main cursor-pointer">Adiar todas as tarefas restantes para amanhã</label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border-subtle mt-6">
            <button 
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button 
              onClick={() => onConfirm(motivo, tempoPerdido, adiarTodas)}
              className="bg-gradient-to-r from-error to-red-600 text-white font-medium px-6 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-error/25 active:scale-95"
            >
              Confirmar Ajuste
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

