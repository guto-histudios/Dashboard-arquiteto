import React, { useState, useMemo } from 'react';
import { Task, TaskStatus } from '../../types';
import { formatarData, isDataFutura, getDataStringBrasil } from '../../utils/dataUtils';
import { CheckCircle, Circle, Clock, AlertTriangle, XCircle, SkipForward, Target, Edit2, Trash2, MoreVertical, CheckSquare, RefreshCw, Lock, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '../../contexts/AppContext';
import { TaskDetailsModal } from './TaskDetailsModal';
import { TaskForm } from './TaskForm';
import { ConfirmModal } from '../common/ConfirmModal';
import { addDays, format } from 'date-fns';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange }) => {
  const isFuturo = isDataFutura(task.data);
  const { activeTaskId, setActiveTaskId, removerTask, atualizarTask, adiarTask, horariosFixos, kpis } = useApp();
  const isActive = activeTaskId === task.id;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [customDate, setCustomDate] = useState('');

  const horarioFixoObj = task.horarioFixoId ? horariosFixos.find(h => h.id === task.horarioFixoId) : null;

  const horarioFim = useMemo(() => {
    if (task.horarioFim) return task.horarioFim;
    if (!task.horarioInicio) return null;
    const [h, m] = task.horarioInicio.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + task.duracao, 0, 0);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }, [task.horarioInicio, task.horarioFim, task.duracao]);

  const isCurrentTime = useMemo(() => {
    if (!task.horarioInicio || task.data !== getDataStringBrasil() || task.status === 'concluida') return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [h, m] = task.horarioInicio.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const endMinutes = startMinutes + task.duracao;
    
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }, [task.horarioInicio, task.duracao, task.data, task.status]);

  const progressPercentage = useMemo(() => {
    if (!isCurrentTime || !task.horarioInicio) return 0;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [h, m] = task.horarioInicio.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const elapsed = currentMinutes - startMinutes;
    return Math.min(100, Math.max(0, (elapsed / task.duracao) * 100));
  }, [isCurrentTime, task.horarioInicio, task.duracao]);

  const getStatusIcon = () => {
    switch (task.status) {
      case 'concluida': return <CheckCircle className="text-success" strokeWidth={1.5} />;
      case 'cancelada': return <XCircle className="text-error" strokeWidth={1.5} />;
      case 'nao_feita': return <SkipForward className="text-warning" strokeWidth={1.5} />;
      case 'em_andamento': return <Target className="text-accent-purple animate-pulse" strokeWidth={1.5} />;
      case 'adiada': return <Calendar className="text-accent-blue" strokeWidth={1.5} />;
      case 'atrasada': return <AlertTriangle className="text-error" strokeWidth={1.5} />;
      default: return <Circle className="text-text-sec" strokeWidth={1.5} />;
    }
  };

  const getPriorityColor = () => {
    if (isActive) return 'border-l-4 border-accent-primary shadow-accent-primary/20 shadow-lg';
    if (isCurrentTime) return 'border-l-4 border-success shadow-success/20 shadow-lg ring-1 ring-success/50';
    if (task.status === 'atrasada') return 'border-l-4 border-error bg-error/5';
    switch (task.prioridade) {
      case 'alta': return 'border-l-4 border-error';
      case 'media': return 'border-l-4 border-warning';
      case 'baixa': return 'border-l-4 border-accent-cyan';
      default: return '';
    }
  };

  const handleStatusChange = (status: TaskStatus) => {
    if (status === 'concluida') {
      if (task.horarioFixo && task.horarioInicio) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [h, m] = task.horarioInicio.split(':').map(Number);
        const startMinutes = h * 60 + m;
        
        if (currentMinutes < startMinutes && task.data === getDataStringBrasil()) {
          alert(`Você não pode concluir um horário fixo antes do seu horário de início (${task.horarioInicio}).`);
          return;
        }
      }
    }

    onStatusChange(task.id, status);
    if (status === 'em_andamento') {
      setActiveTaskId(task.id);
    } else if (isActive) {
      setActiveTaskId(null);
    }
    setIsMenuOpen(false);
  };

  const handlePostpone = (date: string) => {
    adiarTask(task.id, date);
    setShowPostponeModal(false);
    setIsMenuOpen(false);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsMenuOpen(false);
    setShowConfirmDelete(true);
  };

  return (
    <>
      <Card 
        onClick={() => setShowDetailsModal(true)}
        className={clsx(
        "relative group transition-all duration-200 cursor-pointer overflow-hidden p-5",
        getPriorityColor(),
        isFuturo && "opacity-50 pointer-events-none",
        (isActive || isCurrentTime) && "scale-[1.02]",
        isCurrentTime && "bg-success/5",
        isActive && "bg-accent-primary/5"
      )}>
        {isActive && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-accent-primary/10 rounded-bl-full -z-10"></div>
        )}
        {isCurrentTime && !isActive && (
          <>
            <div className="absolute top-0 right-0 w-16 h-16 bg-success/10 rounded-bl-full -z-10"></div>
            <div className="absolute bottom-0 left-0 h-1 bg-success transition-all duration-1000 rounded-bl-2xl" style={{ width: `${progressPercentage}%` }}></div>
          </>
        )}
        
        <div className="flex justify-between items-start mb-3">
          <h3 className={clsx(
            "font-serif font-semibold text-lg tracking-tight pr-8", 
            task.status === 'concluida' && "line-through text-text-sec",
            isActive && "text-accent-purple",
            isCurrentTime && !isActive && "text-emerald-400",
            task.status === 'atrasada' && "text-error",
            !['concluida', 'atrasada'].includes(task.status) && !isActive && !isCurrentTime && "text-text-main"
          )}>
            {task.horarioInicio ? (
              <span className="flex items-center gap-2">
                <span className={clsx(
                  "text-sm font-bold px-2 py-1 rounded-md border font-sans",
                  task.horarioFixo 
                    ? "bg-accent-blue/10 border-accent-blue/30 text-accent-blue flex items-center gap-1" 
                    : "bg-bg-sec border-border-subtle text-text-sec"
                )}>
                  {task.horarioFixo && <Lock size={12} strokeWidth={1.5} />}
                  {task.horarioInicio} - {horarioFim}
                </span>
                <span>{task.titulo}</span>
              </span>
            ) : (
              task.titulo
            )}
          </h3>
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1.5 hover:bg-bg-main rounded-lg transition-colors text-text-sec hover:text-text-main"
            >
              <MoreVertical size={18} strokeWidth={1.5} />
            </button>
            
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}></div>
                <div className="absolute right-0 mt-2 w-48 bg-bg-sec border border-border-subtle rounded-xl shadow-2xl py-2 z-20 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                  <div className="px-3 py-1 text-xs font-medium text-text-sec uppercase tracking-wider">Status</div>
                  <button onClick={() => handleStatusChange('concluida')} className="block px-4 py-2 text-sm text-success hover:bg-bg-main w-full text-left transition-colors">Concluir</button>
                  <button onClick={() => handleStatusChange('em_andamento')} className="block px-4 py-2 text-sm text-accent-purple hover:bg-bg-main w-full text-left transition-colors">Focar (Pomodoro)</button>
                  <button onClick={() => setShowPostponeModal(true)} className="block px-4 py-2 text-sm text-accent-blue hover:bg-bg-main w-full text-left transition-colors">Adiar</button>
                  <button onClick={() => handleStatusChange('nao_feita')} className="block px-4 py-2 text-sm text-warning hover:bg-bg-main w-full text-left transition-colors">Não Feita</button>
                  <button onClick={() => handleStatusChange('cancelada')} className="block px-4 py-2 text-sm text-error hover:bg-bg-main w-full text-left transition-colors">Cancelar</button>
                  
                  <div className="border-t border-border-subtle my-1"></div>
                  <div className="px-3 py-1 text-xs font-medium text-text-sec uppercase tracking-wider">Ações</div>
                  <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-bg-main w-full text-left transition-colors">
                    <Trash2 size={14} strokeWidth={1.5} /> Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {task.descricao && <p className="text-text-sec text-sm mb-4 leading-relaxed">{task.descricao}</p>}

        {task.tipoConclusao === 'porKPI' && task.kpiVinculado && (() => {
          const kpi = kpis.find(k => k.id === task.kpiVinculado);
          if (!kpi) return null;
          const progress = Math.min(100, Math.max(0, (kpi.valorAtual / kpi.valorMeta) * 100));
          return (
            <div className="mb-4 bg-accent-blue/10 border border-accent-blue/20 rounded-lg p-3">
              <div className="flex items-center justify-between text-accent-blue mb-2">
                <div className="flex items-center gap-2">
                  <Target size={16} />
                  <span className="text-sm font-medium">Esta task repete até atingir a meta do KPI</span>
                </div>
                <span className="text-xs font-bold">{kpi.valorAtual} / {kpi.valorMeta} {kpi.unidade}</span>
              </div>
              <div className="h-1.5 bg-bg-sec rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-blue rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          );
        })()}

        {task.tipoConclusao === 'porFinalizacao' && (
          <div className="mb-4 bg-accent-purple/10 border border-accent-purple/20 rounded-lg p-3 flex items-center gap-2 text-accent-purple">
            <CheckCircle size={16} strokeWidth={1.5} />
            <span className="text-sm font-medium">Só recria nova task após 100% de conclusão</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-text-sec mt-4">
          <div className="flex items-center gap-1.5 bg-bg-sec px-2.5 py-1 rounded-md border border-border-subtle">
            <Clock size={14} className="text-accent-blue" strokeWidth={1.5} />
            <span className="font-medium">{task.duracao} min</span>
          </div>
          
          {task.pomodorosFeitos > 0 && (
            <div className="flex items-center gap-1.5 bg-accent-purple/10 text-accent-purple px-2.5 py-1 rounded-md border border-accent-purple/20">
              <Target size={14} strokeWidth={1.5} />
              <span className="font-medium">{task.pomodorosFeitos} ciclos</span>
            </div>
          )}

          {task.prazo && (
            <div className="flex items-center gap-1.5 bg-bg-sec px-2.5 py-1 rounded-md border border-border-subtle">
              <AlertTriangle size={14} className="text-warning" strokeWidth={1.5} />
              <span className="font-medium">{formatarData(task.prazo)}</span>
            </div>
          )}
          
          {task.deadline && (
            <div className="flex items-center gap-1.5 bg-error/10 text-error px-2.5 py-1 rounded-md border border-error/20" title="Deadline">
              <AlertTriangle size={14} strokeWidth={1.5} />
              <span className="font-medium">Deadline: {formatarData(task.deadline)}</span>
            </div>
          )}

          {task.vezesAdiada !== undefined && task.vezesAdiada > 0 && (
            <div className="flex items-center gap-1.5 bg-warning/10 text-warning px-2.5 py-1 rounded-md border border-warning/20" title="Vezes adiada">
              <SkipForward size={14} strokeWidth={1.5} />
              <span className="font-medium">Adiada {task.vezesAdiada}x</span>
            </div>
          )}
          
          {task.tipoRepeticao === 'diasSemana' && task.diasSemana && task.diasSemana.length > 0 && (
            <div className="flex items-center gap-1.5 bg-accent-blue/10 text-accent-blue px-2.5 py-1 rounded-md border border-accent-blue/20" title={task.justificativaFrequencia || "Dias de repetição"}>
              <RefreshCw size={14} strokeWidth={1.5} />
              <span className="font-medium">
                Repete: {task.diasSemana.map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]).join(', ')}
                {task.dataInicio && task.dataFim && ` (${formatarData(task.dataInicio, 'dd/MM')} a ${formatarData(task.dataFim, 'dd/MM')})`}
              </span>
            </div>
          )}
          
          {task.tipoRepeticao === 'diaria' && (
            <div className="flex items-center gap-1.5 bg-accent-blue/10 text-accent-blue px-2.5 py-1 rounded-md border border-accent-blue/20" title={task.justificativaFrequencia || "Repetição Diária"}>
              <RefreshCw size={14} strokeWidth={1.5} />
              <span className="font-medium">Repete: Diariamente</span>
            </div>
          )}

          {task.tipoRepeticao === 'semanal' && (
            <div className="flex items-center gap-1.5 bg-accent-blue/10 text-accent-blue px-2.5 py-1 rounded-md border border-accent-blue/20" title={task.justificativaFrequencia || "Repetição Semanal"}>
              <RefreshCw size={14} strokeWidth={1.5} />
              <span className="font-medium">Repete: Semanalmente</span>
            </div>
          )}

          {task.tipoRepeticao === 'quinzenal' && (
            <div className="flex items-center gap-1.5 bg-accent-blue/10 text-accent-blue px-2.5 py-1 rounded-md border border-accent-blue/20" title={task.justificativaFrequencia || "Repetição Quinzenal"}>
              <RefreshCw size={14} strokeWidth={1.5} />
              <span className="font-medium">Repete: Quinzenalmente</span>
            </div>
          )}

          {task.tipoRepeticao === 'mensal' && (
            <div className="flex items-center gap-1.5 bg-accent-blue/10 text-accent-blue px-2.5 py-1 rounded-md border border-accent-blue/20" title={task.justificativaFrequencia || "Repetição Mensal"}>
              <RefreshCw size={14} strokeWidth={1.5} />
              <span className="font-medium">Repete: Mensalmente</span>
            </div>
          )}
          
          {task.vezesConcluida !== undefined && task.vezesConcluida > 0 && (
            <div className="flex items-center gap-1.5 bg-success/10 text-success px-2.5 py-1 rounded-md border border-success/20" title="Vezes concluída">
              <CheckCircle size={14} strokeWidth={1.5} />
              <span className="font-medium">Concluída {task.vezesConcluida}x</span>
            </div>
          )}
          
          <span className="bg-bg-sec border border-border-subtle px-2.5 py-1 rounded-md text-text-sec capitalize font-medium">{task.categoria}</span>
          <span className="flex items-center gap-1 ml-auto" title="Status atual">
            {getStatusIcon()}
          </span>
        </div>

        {isFuturo && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-main/60 backdrop-blur-sm rounded-2xl">
            <span className="text-sm font-medium bg-bg-card border border-border-subtle px-4 py-2 rounded-xl shadow-lg text-text-main">
              Disponível em {formatarData(task.data)}
            </span>
          </div>
        )}
      </Card>

      {showPostponeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
          <Card className="w-full max-w-md p-8 text-center animate-slide-up bg-bg-sec">
            <div className="w-20 h-20 bg-accent-blue/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-accent-blue/30">
              <Calendar size={40} className="text-accent-blue" strokeWidth={1.5} />
            </div>
            
            <h2 className="text-2xl font-serif font-bold mb-3 text-text-main">Adiar Tarefa</h2>
            <p className="text-text-sec mb-8 text-lg">Para quando você quer adiar esta tarefa?</p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => handlePostpone(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
                className="bg-bg-sec border border-border-subtle hover:border-accent-blue/50 hover:bg-accent-blue/10 text-text-main px-6 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300"
              >
                <Calendar size={24} className="text-accent-blue" strokeWidth={1.5} />
                <div className="text-left">
                  <div className="font-bold text-lg">Amanhã</div>
                  <div className="text-sm text-text-sec">Mover para o próximo dia</div>
                </div>
              </button>
              
              <div className="relative">
                <Input 
                  type="date" 
                  className="w-full"
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                />
                <Button 
                  onClick={() => customDate && handlePostpone(customDate)}
                  disabled={!customDate}
                  className="absolute right-2 top-2 bottom-2 px-4"
                >
                  Confirmar
                </Button>
              </div>

              <button 
                onClick={() => setShowPostponeModal(false)}
                className="text-text-sec hover:text-text-main transition-colors mt-2"
              >
                Cancelar
              </button>
            </div>
          </Card>
        </div>
      )}

      <TaskDetailsModal
        task={task}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onEdit={() => {
          setShowDetailsModal(false);
          setShowEditModal(true);
        }}
        onDelete={() => {
          setShowDetailsModal(false);
          handleDelete();
        }}
        onStatusChange={(status) => {
          setShowDetailsModal(false);
          handleStatusChange(status);
        }}
      />

      <TaskForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={(updatedTask) => {
          atualizarTask(task.id, updatedTask);
        }}
        initialTask={task}
      />

      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Excluir Tarefa"
        message="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => {
          setShowConfirmDelete(false);
          removerTask(task.id);
        }}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </>
  );
}

