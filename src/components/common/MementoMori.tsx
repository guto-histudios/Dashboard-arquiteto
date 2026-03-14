import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { differenceInDays, differenceInYears, addYears, startOfDay } from 'date-fns';
import { Hourglass } from 'lucide-react';

export function MementoMori() {
  const { userProfile } = useApp();
  const [stats, setStats] = useState<{
    idadeAnos: number;
    idadeDias: number;
    totalDias: number;
    diasVividos: number;
    diasRestantes: number;
    percentualVivido: number;
  } | null>(null);

  useEffect(() => {
    if (!userProfile?.dataNascimento || !userProfile?.expectativaVida) {
      return;
    }

    const calculateStats = () => {
      const hoje = startOfDay(new Date());
      const nascimento = startOfDay(new Date(userProfile.dataNascimento));
      const expectativaAnos = userProfile.expectativaVida;

      const dataFim = addYears(nascimento, expectativaAnos);
      
      const idadeAnos = differenceInYears(hoje, nascimento);
      const totalDias = differenceInDays(dataFim, nascimento);
      const diasVividos = differenceInDays(hoje, nascimento);
      const diasRestantes = totalDias - diasVividos;
      
      const percentualVivido = Math.min(Math.max((diasVividos / totalDias) * 100, 0), 100);

      setStats({
        idadeAnos,
        idadeDias: diasVividos,
        totalDias,
        diasVividos,
        diasRestantes,
        percentualVivido
      });
    };

    calculateStats();
    
    // Recalculate at midnight if left open
    const now = new Date();
    const tomorrow = startOfDay(addYears(now, 0)); // just to get start of day
    tomorrow.setDate(tomorrow.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timer = setTimeout(calculateStats, msUntilMidnight);
    return () => clearTimeout(timer);
  }, [userProfile?.dataNascimento, userProfile?.expectativaVida]);

  if (!stats) return null;

  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-bg-sec/50 to-bg-bg-main/50 z-0"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-text-sec">
            <Hourglass size={18} className="text-accent-purple" />
            <h3 className="font-medium tracking-wide uppercase text-xs">Memento Mori</h3>
          </div>
          <span className="text-xs font-mono text-text-sec bg-bg-main px-2 py-1 rounded-md border border-border-subtle">
            {stats.percentualVivido.toFixed(2)}%
          </span>
        </div>

        <div className="mb-4">
          <div className="h-2 w-full bg-bg-main rounded-full overflow-hidden border border-border-subtle">
            <div 
              className="h-full bg-gradient-to-r from-accent-blue to-accent-purple transition-all duration-1000 ease-out"
              style={{ width: `${stats.percentualVivido}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-sec mb-1">Dias Vividos</p>
            <p className="text-xl font-mono font-medium text-white">
              {stats.diasVividos.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-sec mb-1">Dias Restantes</p>
            <p className="text-xl font-mono font-medium text-accent-purple">
              {Math.max(0, stats.diasRestantes).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border-subtle/50 text-center">
          <p className="text-xs text-text-sec italic opacity-70 group-hover:opacity-100 transition-opacity">
            "Lembre-se de que você vai morrer. O tempo é limitado."
          </p>
        </div>
      </div>
    </div>
  );
}
