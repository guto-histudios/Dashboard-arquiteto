import React from 'react';
import { Habito } from '../../types';
import { Check, Flame } from 'lucide-react';
import { clsx } from 'clsx';
import { getDataStringBrasil } from '../../utils/dataUtils';

interface HabitoCardProps {
  habito: Habito;
  onToggle: (id: string, data: string) => void;
}

export const HabitoCard: React.FC<HabitoCardProps> = ({ habito, onToggle }) => {
  const hoje = getDataStringBrasil();
  const isConcluidoHoje = habito.conclusoes?.some(c => c.data === hoje && c.concluido);

  return (
    <div className="glass-card p-5 flex items-center justify-between group hover:border-accent-blue/30 transition-all duration-300">
      <div>
        <h3 className="font-semibold text-lg tracking-tight group-hover:text-accent-blue transition-colors">{habito.nome}</h3>
        <div className="flex items-center gap-3 mt-2">
          <div className={clsx(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300",
            habito.streak > 0 
              ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" 
              : "bg-bg-sec text-text-sec border border-border-subtle"
          )}>
            <Flame size={14} className={clsx(habito.streak > 0 && "fill-orange-500 animate-pulse")} />
            <span>{habito.streak || 0} dias</span>
          </div>
          <span className="text-xs text-text-sec/60 capitalize">{habito.categoria}</span>
        </div>
      </div>
      
      <button 
        onClick={() => onToggle(habito.id, hoje)}
        className={clsx(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95",
          isConcluidoHoje 
            ? "bg-gradient-to-br from-success to-emerald-600 text-white shadow-lg shadow-success/20 scale-105" 
            : "bg-bg-sec border border-border-subtle text-text-sec hover:bg-border-subtle hover:text-white hover:border-accent-blue/50"
        )}
      >
        {isConcluidoHoje ? <Check size={24} strokeWidth={3} /> : <div className="w-5 h-5 rounded-md border-2 border-text-sec/30 group-hover:border-accent-blue/50 transition-colors" />}
      </button>
    </div>
  );
}

