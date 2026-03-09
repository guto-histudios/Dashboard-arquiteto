import React, { useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { X, Target, Clock, CheckCircle } from 'lucide-react';

export function FocusMode() {
  const { isFocusMode, setIsFocusMode, activeTaskId, tasks, mudarStatus } = useApp();

  const activeTask = tasks.find(t => t.id === activeTaskId);

  // Keyboard shortcut to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        if (window.confirm('Deseja sair do Modo Foco?')) {
          setIsFocusMode(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, setIsFocusMode]);

  if (!isFocusMode) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-bg-main flex flex-col items-center justify-center p-6 animate-fade-in">
      
      {/* Exit Button */}
      <button 
        onClick={() => {
          if (window.confirm('Deseja sair do Modo Foco?')) {
            setIsFocusMode(false);
          }
        }}
        className="absolute top-6 right-6 p-3 text-text-sec hover:text-white hover:bg-bg-sec rounded-xl transition-all flex items-center gap-2 group"
      >
        <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Sair (Esc)</span>
        <X size={24} />
      </button>

      {/* Main Content */}
      <div className="w-full max-w-2xl flex flex-col items-center text-center space-y-12">
        
        {/* Header Icon */}
        <div className="w-24 h-24 rounded-full bg-accent-purple/10 flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(139,92,246,0.2)]">
          <Target size={48} className="text-accent-purple" />
        </div>

        {/* Task Info */}
        {activeTask ? (
          <div className="space-y-6 w-full">
            <div className="inline-block px-4 py-1.5 rounded-full bg-bg-sec border border-border-subtle text-text-sec text-sm font-medium uppercase tracking-wider mb-2">
              {activeTask.categoria}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
              {activeTask.titulo}
            </h1>
            {activeTask.descricao && (
              <p className="text-xl text-text-sec max-w-xl mx-auto">
                {activeTask.descricao}
              </p>
            )}
            
            <div className="flex items-center justify-center gap-6 pt-8">
              <div className="flex items-center gap-2 text-text-sec bg-bg-sec px-4 py-2 rounded-xl">
                <Clock size={20} className="text-accent-blue" />
                <span className="font-medium">{activeTask.duracao} min estimados</span>
              </div>
              <button 
                onClick={() => {
                  mudarStatus(activeTask.id, 'concluida');
                  setIsFocusMode(false);
                }}
                className="flex items-center gap-2 bg-success/10 text-success hover:bg-success hover:text-white px-6 py-2 rounded-xl transition-all font-medium border border-success/20"
              >
                <CheckCircle size={20} />
                Concluir Tarefa
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white">Modo Foco Ativado</h1>
            <p className="text-xl text-text-sec">
              Nenhuma tarefa selecionada. Selecione uma tarefa no timer Pomodoro para focar nela.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
