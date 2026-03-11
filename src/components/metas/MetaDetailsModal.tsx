import React from 'react';
import { Meta } from '../../types';
import { X, Target, CheckCircle, Calendar, Link as LinkIcon, Trash2, Edit2, Archive } from 'lucide-react';
import { clsx } from 'clsx';
import { formatarData } from '../../utils/dataUtils';
import { useApp } from '../../contexts/AppContext';

interface MetaDetailsModalProps {
  meta: Meta;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MetaDetailsModal({ meta, isOpen, onClose, onEdit, onDelete }: MetaDetailsModalProps) {
  const { tasks, kpis } = useApp();

  if (!isOpen) return null;

  const isConcluida = meta.status === 'concluida';
  const isArquivada = meta.arquivada;
  const isFalha = isArquivada && meta.resultado === 'falha';

  const colorConfig = {
    semanal: {
      text: 'text-blue-500',
      bg: 'bg-blue-500',
      bgOpacity: 'bg-blue-500/10',
      gradient: 'from-blue-500 to-blue-400'
    },
    mensal: {
      text: 'text-green-500',
      bg: 'bg-green-500',
      bgOpacity: 'bg-green-500/10',
      gradient: 'from-green-500 to-green-400'
    },
    trimestral: {
      text: 'text-purple-500',
      bg: 'bg-purple-500',
      bgOpacity: 'bg-purple-500/10',
      gradient: 'from-purple-500 to-purple-400'
    }
  };

  const theme = colorConfig[meta.periodo as keyof typeof colorConfig] || colorConfig.semanal;

  const linkedTasks = meta.tasksVinculadas?.map(id => tasks.find(t => t.id === id)).filter(Boolean) || [];
  const linkedKpi = meta.kpiVinculado ? kpis.find(k => k.id === meta.kpiVinculado) : null;

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-bg-main border border-border-subtle w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
        
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex justify-between items-start bg-bg-sec/50">
          <div className="flex items-center gap-3">
            <div className={clsx(
              "p-3 rounded-xl",
              isConcluida ? "bg-success/10 text-success" : isFalha ? "bg-red-500/10 text-red-500" : theme.bgOpacity + " " + theme.text
            )}>
              {isConcluida ? <CheckCircle size={24} /> : <Target size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{meta.titulo}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-text-sec uppercase tracking-widest bg-bg-main border border-border-subtle px-2 py-0.5 rounded-md">
                  {meta.periodo}
                </span>
                <span className={clsx(
                  "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                  meta.status === 'concluida' ? "bg-success/20 text-success" :
                  meta.status === 'em_andamento' ? "bg-accent-purple/20 text-accent-purple" :
                  "bg-bg-main border border-border-subtle text-text-sec"
                )}>
                  {meta.status.replace('_', ' ')}
                </span>
                {isArquivada && (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-bg-sec border border-border-subtle text-text-sec flex items-center gap-1">
                    <Archive size={10} />
                    Arquivada
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-sec hover:text-white hover:bg-bg-main rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {meta.descricao && (
            <div>
              <h3 className="text-sm font-bold text-text-sec uppercase tracking-wider mb-2">Descrição</h3>
              <p className="text-text-main text-sm leading-relaxed bg-bg-sec/30 p-4 rounded-xl border border-border-subtle/50">
                {meta.descricao}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-text-sec uppercase tracking-wider mb-2">Período</h3>
            <div className="flex items-center gap-2 text-sm text-white font-medium bg-bg-sec/50 p-3 rounded-xl border border-border-subtle/50 w-fit">
              <Calendar size={16} className={theme.text} />
              <span>{formatarData(meta.dataInicio)} até {formatarData(meta.dataFim)}</span>
            </div>
            {meta.deadline && (
              <p className="text-xs text-text-sec mt-2">
                Deadline: {formatarData(meta.deadline)}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <h3 className="text-sm font-bold text-text-sec uppercase tracking-wider">Progresso Atual</h3>
              <span className="text-white font-bold">{Math.round(progressoTotal)}%</span>
            </div>
            <div className="w-full bg-bg-sec rounded-full h-3 border border-border-subtle overflow-hidden mb-2">
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
            
            {/* Progress Text */}
            <div className="flex flex-col gap-1 mt-3">
              {linkedTasks.length > 0 && (
                <p className="text-xs text-text-sec flex items-center gap-1.5">
                  <CheckCircle size={12} className={tarefasConcluidas === linkedTasks.length ? "text-success" : "text-text-sec"} />
                  <span className={tarefasConcluidas === linkedTasks.length ? "text-success font-medium" : ""}>
                    {tarefasConcluidas} de {linkedTasks.length} tarefas concluídas
                  </span>
                </p>
              )}
              {linkedKpi && meta.metaProgresso && (
                <p className="text-xs text-text-sec flex items-center gap-1.5">
                  <Target size={12} className={linkedKpi.valorAtual >= meta.metaProgresso ? "text-success" : "text-text-sec"} />
                  <span className={linkedKpi.valorAtual >= meta.metaProgresso ? "text-success font-medium" : ""}>
                    KPI "{linkedKpi.titulo}": {linkedKpi.valorAtual} / {meta.metaProgresso}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-text-sec uppercase tracking-wider mb-3">Vinculações</h3>
            <div className="space-y-2">
              {linkedTasks.map(t => (
                <div key={t?.id} className="flex items-center gap-3 bg-bg-sec/50 p-3 rounded-xl border border-border-subtle">
                  <div className="p-1.5 bg-bg-main rounded-md text-text-sec">
                    <CheckCircle size={14} className={t?.status === 'concluida' ? "text-success" : ""} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{t?.titulo}</p>
                    <p className="text-[10px] text-text-sec uppercase tracking-wider">Tarefa</p>
                  </div>
                </div>
              ))}
              
              {linkedKpi && (
                <div className="flex items-center gap-3 bg-bg-sec/50 p-3 rounded-xl border border-border-subtle">
                  <div className={clsx("p-1.5 bg-bg-main rounded-md", theme.text)}>
                    <Target size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{linkedKpi.titulo}</p>
                    <p className="text-[10px] text-text-sec uppercase tracking-wider">KPI</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border-subtle bg-bg-sec/50 flex justify-end gap-3">
          <button
            onClick={onDelete}
            className="px-4 py-2 rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            Excluir
          </button>
          {!isArquivada && (
            <button
              onClick={onEdit}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-bg-main border border-border-subtle text-white hover:bg-bg-sec transition-colors flex items-center gap-2"
            >
              <Edit2 size={16} />
              Editar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
