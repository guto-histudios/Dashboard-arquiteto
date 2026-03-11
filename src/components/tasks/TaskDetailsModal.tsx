import React, { useState } from 'react';
import { Task, TaskStatus } from '../../types';
import { formatarData } from '../../utils/dataUtils';
import { X, Clock, Calendar, AlertTriangle, Target, RefreshCw, Star, Edit2, Trash2, Play, CheckCircle, Circle, SkipForward, XCircle, MoreVertical, Activity } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface TaskDetailsModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
}

export function TaskDetailsModal({ task, isOpen, onClose, onEdit, onDelete, onStatusChange }: TaskDetailsModalProps) {
  const { kpis, metas, setActiveTaskId } = useApp();
  
  if (!isOpen) return null;

  const kpiVinculado = task.kpiVinculado ? kpis.find(k => k.id === task.kpiVinculado) : null;
  const metaVinculada = task.metaVinculada ? metas.find(m => m.id === task.metaVinculada) : null;

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'concluida': return 'Concluída';
      case 'cancelada': return 'Cancelada';
      case 'nao_feita': return 'Não Feita';
      case 'em_andamento': return 'Em Andamento';
      default: return 'Não Iniciada';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'concluida': return 'text-success bg-success/10 border-success/20';
      case 'cancelada': return 'text-error bg-error/10 border-error/20';
      case 'nao_feita': return 'text-warning bg-warning/10 border-warning/20';
      case 'em_andamento': return 'text-accent-purple bg-accent-purple/10 border-accent-purple/20';
      default: return 'text-text-sec bg-bg-sec border-border-subtle';
    }
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'text-error bg-error/10 border-error/20';
      case 'media': return 'text-warning bg-warning/10 border-warning/20';
      case 'baixa': return 'text-accent-blue bg-accent-blue/10 border-accent-blue/20';
      default: return 'text-text-sec bg-bg-sec border-border-subtle';
    }
  };

  const handleStartPomodoro = () => {
    setActiveTaskId(task.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start p-6 border-b border-border-subtle sticky top-0 bg-bg-card/95 backdrop-blur-sm z-10">
          <div className="pr-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2">{task.titulo}</h2>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-md border text-xs font-medium ${getStatusColor(task.status)}`}>
                {getStatusText(task.status)}
              </span>
              <span className={`px-2.5 py-1 rounded-md border text-xs font-medium ${getPriorityColor(task.prioridade)} capitalize`}>
                Prioridade {task.prioridade}
              </span>
              <span className="px-2.5 py-1 rounded-md border border-border-subtle bg-bg-sec text-text-sec text-xs font-medium capitalize">
                {task.categoria}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-text-sec hover:text-white transition-colors p-2 hover:bg-bg-sec rounded-lg shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Descrição */}
          {task.descricao && (
            <div>
              <h3 className="text-sm font-medium text-text-sec mb-2 uppercase tracking-wider">Descrição</h3>
              <div className="bg-bg-sec/50 p-4 rounded-xl border border-border-subtle text-sm whitespace-pre-wrap">
                {task.descricao}
              </div>
            </div>
          )}

          {/* Grid de Informações */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-bg-sec/30 p-4 rounded-xl border border-border-subtle">
              <div className="flex items-center gap-2 text-text-sec mb-1">
                <Calendar size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">Data</span>
              </div>
              <div className="font-medium">{formatarData(task.data)}</div>
            </div>

            <div className="bg-bg-sec/30 p-4 rounded-xl border border-border-subtle">
              <div className="flex items-center gap-2 text-text-sec mb-1">
                <Clock size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">Horário / Duração</span>
              </div>
              <div className="font-medium">
                {task.horarioInicio ? `${task.horarioInicio} (${task.duracao}m)` : `${task.duracao} min`}
              </div>
            </div>

            {task.prazo && (
              <div className="bg-bg-sec/30 p-4 rounded-xl border border-border-subtle">
                <div className="flex items-center gap-2 text-text-sec mb-1">
                  <AlertTriangle size={16} className="text-warning" />
                  <span className="text-xs font-medium uppercase tracking-wider">Prazo</span>
                </div>
                <div className="font-medium">{formatarData(task.prazo)}</div>
              </div>
            )}

            {task.deadline && (
              <div className="bg-error/5 p-4 rounded-xl border border-error/20">
                <div className="flex items-center gap-2 text-error mb-1">
                  <AlertTriangle size={16} />
                  <span className="text-xs font-medium uppercase tracking-wider">Deadline</span>
                </div>
                <div className="font-medium text-error">{formatarData(task.deadline)}</div>
              </div>
            )}

            <div className="bg-bg-sec/30 p-4 rounded-xl border border-border-subtle">
              <div className="flex items-center gap-2 text-text-sec mb-1">
                <RefreshCw size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">Repetição</span>
              </div>
              <div className="font-medium capitalize">
                {task.tipoRepeticao === 'diasSemana' ? 'Dias Específicos' : task.tipoRepeticao.replace('_', ' ')}
                {task.tipoRepeticao === 'diasSemana' && task.diasSemana && (
                  <span className="block text-xs text-text-sec mt-1 normal-case">
                    Dias: {task.diasSemana.map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]).join(', ')}
                  </span>
                )}
                {task.justificativaFrequencia && (
                  <span className="block text-xs text-text-sec mt-2 italic border-l-2 border-accent-blue/30 pl-2 normal-case">
                    "{task.justificativaFrequencia}"
                  </span>
                )}
              </div>
            </div>

            <div className="bg-bg-sec/30 p-4 rounded-xl border border-border-subtle">
              <div className="flex items-center gap-2 text-text-sec mb-1">
                <Target size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">Pomodoros</span>
              </div>
              <div className="font-medium">{task.pomodorosFeitos || 0} ciclos</div>
            </div>
          </div>

          {/* Vinculações */}
          {(kpiVinculado || metaVinculada || task.xpGanho) && (
            <div>
              <h3 className="text-sm font-medium text-text-sec mb-3 uppercase tracking-wider">Vinculações & Recompensas</h3>
              <div className="flex flex-col gap-2">
                {kpiVinculado && (
                  <div className="flex items-center gap-3 bg-bg-sec/30 p-3 rounded-lg border border-border-subtle">
                    <Activity size={18} className="text-accent-blue" />
                    <div>
                      <div className="text-xs text-text-sec">KPI Vinculado</div>
                      <div className="font-medium text-sm">{kpiVinculado.titulo}</div>
                    </div>
                  </div>
                )}
                {metaVinculada && (
                  <div className="flex items-center gap-3 bg-bg-sec/30 p-3 rounded-lg border border-border-subtle">
                    <Target size={18} className="text-accent-purple" />
                    <div>
                      <div className="text-xs text-text-sec">Meta Vinculada</div>
                      <div className="font-medium text-sm">{metaVinculada.titulo}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 bg-bg-sec/30 p-3 rounded-lg border border-border-subtle">
                  <Star size={18} className={task.xpGanho ? "text-warning" : "text-text-sec"} />
                  <div>
                    <div className="text-xs text-text-sec">XP Ganho</div>
                    <div className="font-medium text-sm">{task.xpGanho ? 'Sim (+10 XP)' : 'Não'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ações Rápidas */}
          <div>
            <h3 className="text-sm font-medium text-text-sec mb-3 uppercase tracking-wider">Ações Rápidas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button 
                onClick={() => onStatusChange('concluida')}
                className="flex flex-col items-center justify-center gap-2 bg-success/10 hover:bg-success/20 text-success p-3 rounded-xl border border-success/20 transition-colors"
              >
                <CheckCircle size={20} />
                <span className="text-xs font-medium">Concluir</span>
              </button>
              <button 
                onClick={() => onStatusChange('em_andamento')}
                className="flex flex-col items-center justify-center gap-2 bg-accent-purple/10 hover:bg-accent-purple/20 text-accent-purple p-3 rounded-xl border border-accent-purple/20 transition-colors"
              >
                <Target size={20} />
                <span className="text-xs font-medium">Fazer</span>
              </button>
              <button 
                onClick={() => onStatusChange('nao_feita')}
                className="flex flex-col items-center justify-center gap-2 bg-warning/10 hover:bg-warning/20 text-warning p-3 rounded-xl border border-warning/20 transition-colors"
              >
                <SkipForward size={20} />
                <span className="text-xs font-medium">Adiar</span>
              </button>
              <button 
                onClick={() => onStatusChange('cancelada')}
                className="flex flex-col items-center justify-center gap-2 bg-error/10 hover:bg-error/20 text-error p-3 rounded-xl border border-error/20 transition-colors"
              >
                <XCircle size={20} />
                <span className="text-xs font-medium">Cancelar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border-subtle bg-bg-sec/50 flex flex-wrap items-center justify-between gap-4 sticky bottom-0">
          <button 
            onClick={onDelete}
            className="flex items-center gap-2 text-error hover:bg-error/10 px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <Trash2 size={18} />
            Excluir
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleStartPomodoro}
              className="flex items-center gap-2 bg-bg-main border border-border-subtle hover:border-accent-purple text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <Play size={18} className="text-accent-purple" />
              Iniciar Pomodoro
            </button>
            <button 
              onClick={onEdit}
              className="flex items-center gap-2 btn-primary"
            >
              <Edit2 size={18} />
              Editar Tarefa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
