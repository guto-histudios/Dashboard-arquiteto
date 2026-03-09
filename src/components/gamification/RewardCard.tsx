import React from 'react';
import { Recompensa } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { Coffee, Pizza, Sun, Film, Croissant, Plane, Monitor, Lock, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface RewardCardProps {
  reward: Recompensa;
  onBuy: (reward: Recompensa) => void;
  canAfford: boolean;
}

export const RewardCard: React.FC<RewardCardProps> = ({ reward, onBuy, canAfford }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee': return <Coffee size={24} />;
      case 'Pizza': return <Pizza size={24} />;
      case 'Sun': return <Sun size={24} />;
      case 'Film': return <Film size={24} />;
      case 'Croissant': return <Croissant size={24} />;
      case 'Plane': return <Plane size={24} />;
      case 'Monitor': return <Monitor size={24} />;
      default: return <Coffee size={24} />;
    }
  };

  const getBgColor = () => {
    switch (reward.tipo) {
      case 'diaria': return 'bg-accent-blue/10 border-accent-blue/20 text-accent-blue';
      case 'semanal': return 'bg-accent-purple/10 border-accent-purple/20 text-accent-purple';
      case 'anual': return 'bg-warning/10 border-warning/20 text-warning';
      default: return 'bg-bg-sec border-border-subtle';
    }
  };

  return (
    <div className="glass-card p-5 flex flex-col h-full relative group hover:scale-[1.02] transition-all duration-300">
      <div className={clsx(
        "absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold uppercase tracking-wider border-b border-l",
        getBgColor()
      )}>
        {reward.tipo}
      </div>

      <div className="flex items-center gap-4 mb-4 mt-2">
        <div className={clsx("p-3 rounded-xl", getBgColor())}>
          {getIcon(reward.icone)}
        </div>
        <div>
          <h3 className="font-bold text-lg leading-tight">{reward.titulo}</h3>
          <p className="text-text-sec text-xs mt-1">{reward.descricao}</p>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border-subtle flex items-center justify-between">
        <div className="font-bold text-xl flex items-center gap-1">
          <span className="text-warning">🪙</span>
          {reward.custo}
        </div>
        
        <button
          onClick={() => onBuy(reward)}
          disabled={!canAfford}
          className={clsx(
            "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2",
            canAfford 
              ? "bg-bg-sec hover:bg-success hover:text-white text-text-main border border-border-subtle hover:border-success" 
              : "bg-bg-main text-text-sec opacity-50 cursor-not-allowed border border-transparent"
          )}
        >
          {canAfford ? (
            <>Comprar</>
          ) : (
            <><Lock size={14} /> Bloqueado</>
          )}
        </button>
      </div>
    </div>
  );
};
