import React, { useState } from 'react';
import { Meta } from '../../types';
import { Target, CheckCircle, Calendar, Link as LinkIcon, AlertTriangle, CheckCheck, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { formatarData, isDataFutura, isDataPassada } from '../../utils/dataUtils';
import { useApp } from '../../contexts/AppContext';
import { MetaDetailsModal } from './MetaDetailsModal';
import { differenceInDays, parseISO } from 'date-fns';

interface MetaCardProps {
  meta: Meta;
  onUpdate: (id: string, updates: Partial<Meta>) => void;
  onDelete?: (id: string) => void;
  onEdit?: (meta: Meta) => void;
}

export const MetaCard: React.FC<MetaCardProps> = ({ meta, onUpdate, onDelete, onEdit }) => {
  const { tasks, kpis } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get linked items names
  const linkedTasks = meta.tasksVinculadas?.map(id => tasks.find(t => t.id === id)).filter(Boolean) || [];
  const linkedKpi = meta.kpiVinculado ? kpis.find(k => k.id === meta.kpiVinculado) : null;

  const hasLinks = linkedTasks.length > 0 || !!linkedKpi;

  // Calculate progress dynamically
  let progressoKpi = 0;
  if (linkedKpi && linkedKpi.valorMeta > 0) {
    progressoKpi = Math.min((linkedKpi.valorAtual / linkedKpi.valorMeta) * 100, 100);
  } else if (linkedKpi && meta.metaProgresso) {
    progressoKpi = Math.min((linkedKpi.valorAtual / meta.metaProgresso) * 100, 100);
  }

  let progressoTasks = 0;
  let tarefasConcluidas = 0;
  if (linkedTasks.length > 0) {
    tarefasConcluidas = linkedTasks.filter(t => t?.status === 'concluida').length;
    progressoTasks = (tarefasConcluidas / linkedTasks.length) * 100;
  }

  let progressoTotal = 0;
  if (linkedKpi && linkedTasks.length > 0) {
    if (progressoKpi > 0 && progressoTasks > 0) {
      progressoTotal = (progressoKpi + progressoTasks) / 2;
    } else {
      progressoTotal = Math.max(progressoKpi, progressoTasks);
    }
  } else if (linkedKpi) {
    progressoTotal = progressoKpi;
  } else if (linkedTasks.length > 0) {
    progressoTotal = progressoTasks;
  } else {
    progressoTotal = meta.progresso || 0;
  }

  const isConcluida = progressoTotal >= 100 || meta.status === 'concluida';
  const isArquivada = meta.arquivada;
  const isFalha = isArquivada && meta.resultado === 'falha';

  const colorConfig = {
    semanal: {
      text: 'text-blue-500',
      bg: 'bg-blue-500',
      borderL: 'border-l-blue-500',
      bgOpacity: 'bg-blue-500/10',
      gradient: 'from-blue-500 to-blue-400'
    },
    mensal: {
      text: 'text-green-500',
      bg: 'bg-green-500',
      borderL: 'border-l-green-500',
      bgOpacity: 'bg-green-500/10',
      gradient: 'from-green-500 to-green-400'
    },
    trimestral: {
      text: 'text-purple-500',
      bg: 'bg-purple-500',
      borderL: 'border-l-purple-500',
      bgOpacity: 'bg-purple-500/10',
      gradient: 'from-purple-500 to-purple-400'
    }
  };

  const theme = colorConfig[meta.periodo as keyof typeof colorConfig] || colorConfig.semanal;

  // Calculate days remaining
  let diasRestantes = 0;
  let prazoTexto = '';
  let prazoCor = 'text-text-sec';

  if (meta.deadline && !isArquivada) {
    diasRestantes = differenceInDays(parseISO(meta.deadline), new Date());
    if (diasRestantes < 0) {
      prazoTexto = 'Expirada';
      prazoCor = 'text-red-500';
    } else if (diasRestantes === 0) {
      prazoTexto = 'Vence hoje';
      prazoCor = 'text-orange-500';
    } else {
      prazoTexto = `${diasRestantes} dias restantes`;
      if (diasRestantes <= 3) prazoCor = 'text-orange-500';
    }
  }

  // Update status if progress reached 100 (only if not archived)
  React.useEffect(() => {
    if (!meta.arquivada) {
      if (progressoTotal >= 100 && meta.status !== 'concluida') {
        onUpdate(meta.id, { status: 'concluida', progresso: 100 });
      } else if (progressoTotal < 100 && meta.progresso !== progressoTotal) {
        onUpdate(meta.id, { progresso: progressoTotal, status: progressoTotal > 0 ? 'em_andamento' : 'nao_iniciada' });
      }
    }
  }, [progressoTotal, meta.id, meta.status, meta.progresso, onUpdate, meta.arquivada]);

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className={clsx(
          "glass-card p-6 border-l-4 relative group cursor-pointer hover:bg-bg-sec/40 transition-colors",
          isConcluida ? "border-l-success" : isFalha ? "border-l-red-500" : theme.borderL,
          isArquivada && "opacity-75 grayscale-[0.3]"
        )}
      >
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className={clsx("font-bold text-xl tracking-tight", isConcluida && "line-through text-text-sec")}>
              {meta.titulo}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold text-text-sec uppercase tracking-widest bg-bg-sec border border-border-subtle px-2.5 py-1 rounded-md inline-block">
                {meta.periodo}
              </span>
              
              {hasLinks && (
                <div className="relative flex items-center">
                  <div className={clsx("bg-bg-sec border border-border-subtle p-1.5 rounded-md cursor-help", theme.text)}>
                    <LinkIcon size={14} />
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-bg-sec border border-border-subtle rounded-xl p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <p className="text-xs font-bold text-white mb-2 border-b border-border-subtle pb-1">Vinculado a:</p>
                    {linkedTasks.length > 0 && (
                      <div className="mb-1">
                        <span className="text-[10px] text-text-sec uppercase font-bold">Tasks:</span>
                        <p className="text-xs text-white truncate">{linkedTasks.length} tarefa(s)</p>
                      </div>
                    )}
                    {linkedKpi && (
                      <div>
                        <span className="text-[10px] text-text-sec uppercase font-bold">KPI:</span>
                        <p className="text-xs text-white truncate">{linkedKpi.titulo}</p>
                      </div>
                    )}
                    {/* Arrow */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border-subtle"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {isConcluida ? (
            <div className="p-2 bg-success/10 rounded-xl">
              {isArquivada ? <CheckCheck className="text-success" size={24} /> : <CheckCircle className="text-success" size={24} />}
            </div>
          ) : isFalha ? (
            <div className="p-2 bg-red-500/10 rounded-xl">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
          ) : (
            <div className={clsx("p-2 rounded-xl", theme.bgOpacity)}>
              <Target className={theme.text} size={24} />
            </div>
          )}
        </div>

        {meta.descricao && <p className="text-text-sec text-sm mb-5 leading-relaxed line-clamp-2">{meta.descricao}</p>}

        <div className="mb-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-sec font-medium">Progresso</span>
            <span className="text-white font-bold">{Math.round(progressoTotal)}%</span>
          </div>
          <div className="w-full bg-bg-sec rounded-full h-2.5 border border-border-subtle overflow-hidden">
            <div 
              className={clsx(
                "h-full rounded-full transition-all duration-1000 ease-out relative bg-gradient-to-r",
                isConcluida ? "from-success to-green-400" : isFalha ? "from-red-500 to-red-400" : theme.gradient
              )}
              style={{ width: `${progressoTotal}%` }}
            >
              {!isConcluida && !isFalha && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
            </div>
          </div>
          
          <div className="mt-2 flex justify-between items-center">
            {linkedTasks.length > 0 ? (
              <p className="text-xs text-text-sec flex items-center gap-1">
                <CheckCircle size={10} className={tarefasConcluidas === linkedTasks.length ? "text-success" : ""} />
                {tarefasConcluidas} de {linkedTasks.length} tarefas concluídas
              </p>
            ) : <span></span>}
            
            {!isArquivada && meta.deadline && (
              <p className={clsx("text-xs font-medium flex items-center gap-1", prazoCor)}>
                <Clock size={10} />
                {prazoTexto}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-sec font-medium bg-bg-sec/50 p-2 rounded-lg border border-border-subtle/50">
          <div className="flex items-center gap-2">
            <Calendar size={14} className={theme.text} />
            <span>{formatarData(meta.dataInicio)}</span>
          </div>
          
          {isArquivada ? (
            <span className={isConcluida ? "text-success" : "text-red-500"}>
              {isConcluida ? `Concluída em ${meta.dataConclusao ? formatarData(meta.dataConclusao) : '-'}` : 'Não concluída'}
            </span>
          ) : (
            <span>Até {meta.deadline ? formatarData(meta.deadline) : formatarData(meta.dataFim)}</span>
          )}
        </div>
      </div>

      <MetaDetailsModal
        meta={meta}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={() => {
          if (!isArquivada) {
            setIsModalOpen(false);
            if (onEdit) onEdit(meta);
          }
        }}
        onDelete={() => {
          setIsModalOpen(false);
          if (onDelete) onDelete(meta.id);
        }}
      />
    </>
  );
}

