import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus } from '../types';
import { TaskCard } from '../components/tasks/TaskCard';
import { KanbanSquare, Trophy, AlertCircle, CheckSquare, RefreshCw, CheckCircle } from 'lucide-react';
import { getDataStringBrasil, deveMostrarTask } from '../utils/dataUtils';
import { clsx } from 'clsx';

export function Kanban() {
  const { tasks, mudarStatus, atualizarTask, config } = useApp();
  const hoje = getDataStringBrasil();
  
  // Only show tasks for today or overdue tasks
  const kanbanTasks = tasks
    .filter(t => !t.concluidaDefinitivamente && (t.data === hoje || (t.data < hoje && t.status !== 'concluida' && t.status !== 'cancelada')))
    .filter(t => !t.deadline || t.deadline >= hoje)
    .filter(t => t.data !== hoje || deveMostrarTask(t, hoje))
    .sort((a, b) => {
      // Fixed time tasks first
      if (a.horarioFixo && !b.horarioFixo) return -1;
      if (!a.horarioFixo && b.horarioFixo) return 1;
      
      if (!a.horario && !b.horario) return 0;
      if (!a.horario) return 1;
      if (!b.horario) return -1;
      return a.horario.localeCompare(b.horario);
    });

  const columns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'nao_iniciada', title: 'A Fazer', color: 'border-text-sec' },
    { id: 'em_andamento', title: 'Fazendo', color: 'border-accent-purple' },
    { id: 'concluida', title: 'Concluído', color: 'border-success' }
  ];

  const getTasksByStatus = (status: TaskStatus) => kanbanTasks.filter(t => t.status === status);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    // Check Kanban WIP limit for 'em_andamento'
    if (status === 'em_andamento') {
      const doingTasks = getTasksByStatus('em_andamento');
      if (doingTasks.length >= config.limiteKanban && !doingTasks.find(t => t.id === taskId)) {
        alert(`Limite WIP excedido! Você só pode ter ${config.limiteKanban} tarefas em andamento ao mesmo tempo.`);
        return;
      }
    }

    const task = tasks.find(t => t.id === taskId);

    mudarStatus(taskId, status);
  };

  // Calculate total XP
  const totalXP = tasks.filter(t => t.xpGanho).length * 10;

  return (
    <div className="space-y-8 pb-20 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent-purple/10 rounded-xl">
            <KanbanSquare size={28} className="text-accent-purple" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Kanban</h1>
            <p className="text-text-sec font-medium">Gerencie seu fluxo de trabalho</p>
          </div>
        </div>
        
        <div className="glass-card px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-warning" />
            <span className="font-bold text-xl text-white">{totalXP} XP</span>
          </div>
          <div className="w-px h-8 bg-border-subtle"></div>
          <div className="text-sm text-text-sec">
            Limite WIP: <span className="text-white font-bold">{config.limiteKanban}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden min-h-[600px]">
        {columns.map(col => {
          const colTasks = getTasksByStatus(col.id);
          const isOverLimit = col.id === 'em_andamento' && colTasks.length > config.limiteKanban;

          return (
            <div 
              key={col.id}
              className={clsx(
                "glass-card flex flex-col overflow-hidden border-t-4 transition-colors",
                col.color,
                isOverLimit && "border-error bg-error/5"
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-bg-sec/50">
                <h2 className="font-bold text-lg">{col.title}</h2>
                <span className={clsx(
                  "px-2.5 py-1 rounded-full text-xs font-bold",
                  isOverLimit ? "bg-error text-white" : "bg-bg-main text-text-sec border border-border-subtle"
                )}>
                  {colTasks.length} {col.id === 'em_andamento' && `/ ${config.limiteKanban}`}
                </span>
              </div>
              
              {isOverLimit && (
                <div className="px-4 py-2 bg-error/20 text-error text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={14} />
                  Limite WIP excedido!
                </div>
              )}

              <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-hide">
                {colTasks.length > 0 ? (
                  colTasks.map(task => (
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <TaskCard task={task} onStatusChange={mudarStatus} />
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-text-sec text-sm border-2 border-dashed border-border-subtle rounded-xl p-8 text-center">
                    Arraste tarefas para cá
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
