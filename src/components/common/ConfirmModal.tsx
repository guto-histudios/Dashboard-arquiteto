import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar', 
  onConfirm, 
  onCancel 
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card w-full max-w-sm animate-slide-up border border-border-subtle" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-border-subtle bg-bg-card/95 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle size={20} className="text-warning" />
            {title}
          </h2>
          <button onClick={onCancel} className="text-text-sec hover:text-white transition-colors p-1.5 hover:bg-bg-sec rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-text-sec text-sm leading-relaxed">{message}</p>
        </div>

        <div className="p-5 border-t border-border-subtle bg-bg-sec/50 flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-sm font-medium text-text-sec hover:text-white hover:bg-bg-main rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 text-sm font-medium bg-error hover:bg-error/90 text-white rounded-lg transition-colors shadow-lg shadow-error/20"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
