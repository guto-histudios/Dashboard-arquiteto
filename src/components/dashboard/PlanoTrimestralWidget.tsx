import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Target, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatarData } from '../../utils/dataUtils';
import { differenceInDays } from 'date-fns';

export function PlanoTrimestralWidget() {
  const { planoTrimestral } = useApp();

  if (!planoTrimestral || planoTrimestral.status === 'concluido') {
    return null;
  }

  const diasRestantes = differenceInDays(new Date(planoTrimestral.dataFim), new Date());
  const progresso = Math.max(0, Math.min(100, ((90 - diasRestantes) / 90) * 100));

  return (
    <div className="bg-bg-sec rounded-2xl p-6 border border-border-subtle shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-blue/10 rounded-lg">
            <Target className="text-accent-blue" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-main">Plano de 3 Meses</h3>
            <p className="text-sm text-text-sec">Mês {planoTrimestral.mesAtual} de 3</p>
          </div>
        </div>
        <Link to="/metas" className="text-accent-blue hover:text-accent-blue/80 transition-colors p-2 rounded-lg hover:bg-accent-blue/10">
          <ChevronRight size={20} />
        </Link>
      </div>

      <div className="mb-4">
        <p className="text-text-main font-medium text-lg leading-tight">{planoTrimestral.objetivoPrincipal}</p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-text-sec flex items-center gap-1">
            <Calendar size={14} />
            Fim: {formatarData(planoTrimestral.dataFim, "dd/MM/yyyy")}
          </span>
          <span className="text-accent-blue font-medium flex items-center gap-1">
            <Clock size={14} />
            {diasRestantes} dias restantes
          </span>
        </div>
        
        <div className="w-full bg-bg-main rounded-full h-2 overflow-hidden">
          <div 
            className="bg-accent-blue h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progresso}%` }}
          ></div>
        </div>
      </div>
      
      {diasRestantes <= 7 && diasRestantes > 0 && (
        <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-2">
          <Clock className="text-warning shrink-0 mt-0.5" size={16} />
          <p className="text-sm text-warning-light">
            Seu plano de 3 meses está chegando ao fim. Prepare-se para a revisão!
          </p>
        </div>
      )}
      
      {diasRestantes <= 0 && (
        <div className="mt-4 p-3 bg-accent-blue/10 border border-accent-blue/30 rounded-lg flex items-start gap-2">
          <Target className="text-accent-blue shrink-0 mt-0.5" size={16} />
          <div className="flex-1">
            <p className="text-sm text-accent-blue mb-2">
              Chegou a hora de revisar seu plano de 3 meses!
            </p>
            <Link to="/revisao-trimestral" className="text-xs font-bold text-accent-blue hover:underline flex items-center gap-1">
              Fazer Revisão <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
