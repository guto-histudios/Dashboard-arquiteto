import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, TrendingUp, BarChart3, Plus, Check, Edit2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Task, KPI } from '../../types';
import { getDataStringBrasil } from '../../utils/dataUtils';
import { v4 as uuidv4 } from 'uuid';

export function TaskProgressionModal() {
  const { taskParaProgredir, setTaskParaProgredir, adicionarTask, adicionarKPI, metas, atualizarMeta } = useApp();
  const [step, setStep] = useState<'initial' | 'preview_task' | 'preview_kpi'>('initial');
  const [suggestedTask, setSuggestedTask] = useState<Partial<Task> | null>(null);
  const [suggestedKPI, setSuggestedKPI] = useState<Partial<KPI> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (taskParaProgredir) {
      setStep('initial');
      setIsEditing(false);
    }
  }, [taskParaProgredir]);

  if (!taskParaProgredir) return null;

  const handleClose = () => {
    setTaskParaProgredir(null);
  };

  const generateDifficultTask = (task: Task): Partial<Task> => {
    const { titulo, duracao, metaVinculada, categoria, prioridade } = task;
    
    const numberRegex = /(\d+)/g;
    const matches = titulo.match(numberRegex);
    
    let novoTitulo = titulo;
    let novaDuracao = Math.round(duracao * 1.3);

    if (matches && matches.length > 0) {
      const firstNumber = parseInt(matches[0]);
      const increasedNumber = Math.round(firstNumber * 1.5);
      novoTitulo = titulo.replace(matches[0], increasedNumber.toString());
    } else {
      novoTitulo = `Avançado: ${titulo}`;
    }

    return {
      titulo: novoTitulo,
      duracao: novaDuracao,
      metaVinculada,
      categoria,
      prioridade,
      status: 'nao_iniciada',
      data: getDataStringBrasil(),
      xpGanho: false,
      pomodorosFeitos: 0,
      vezAtual: 1
    };
  };

  const generateKPI = (task: Task): Partial<KPI> => {
    const { titulo } = task;
    return {
      titulo: `Consistência: ${titulo}`,
      unidade: 'vezes',
      valorAtual: 0,
      valorMeta: 7,
      tipoCalculo: 'automatico',
      tipoAutomatico: 'tasks_concluidas',
      frequencia: 'semanal',
      dataInicio: getDataStringBrasil(),
      historico: []
    };
  };

  const handleSelectDifficult = () => {
    const suggestion = generateDifficultTask(taskParaProgredir);
    setSuggestedTask(suggestion);
    setStep('preview_task');
  };

  const handleSelectKPI = () => {
    const suggestion = generateKPI(taskParaProgredir);
    setSuggestedKPI(suggestion);
    setStep('preview_kpi');
  };

  const handleConfirmTask = () => {
    if (suggestedTask) {
      const newTaskId = uuidv4();
      const newTask = {
        ...suggestedTask,
        id: newTaskId,
      } as Task;
      
      adicionarTask(newTask);

      // If linked to a meta, update the meta to include this new task
      if (newTask.metaVinculada) {
        const meta = metas.find(m => m.id === newTask.metaVinculada);
        if (meta) {
          atualizarMeta(meta.id, {
            tasksVinculadas: [...(meta.tasksVinculadas || []), newTaskId]
          });
        }
      }

      handleClose();
    }
  };

  const handleConfirmKPI = () => {
    if (suggestedKPI) {
      adicionarKPI({
        ...suggestedKPI,
        id: uuidv4(),
      } as KPI);
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-card w-full max-w-md overflow-hidden border border-border-subtle shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 text-center bg-gradient-to-b from-accent-blue/10 to-transparent">
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 text-text-sec hover:text-white transition-colors p-1.5 hover:bg-bg-sec rounded-lg"
            >
              <X size={20} />
            </button>
            
            <div className="w-16 h-16 bg-accent-blue/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent-blue/30 shadow-lg shadow-accent-blue/10">
              <Trophy className="text-accent-blue" size={32} />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-1">Tarefa concluída! 🎉</h2>
            <p className="text-text-sec">Você está evoluindo. Quer continuar o progresso?</p>
          </div>

          <div className="p-6">
            {step === 'initial' && (
              <div className="space-y-3">
                <button
                  onClick={handleSelectDifficult}
                  className="w-full flex items-center gap-4 p-4 bg-bg-sec hover:bg-accent-blue/10 border border-border-subtle hover:border-accent-blue/50 rounded-xl transition-all group"
                >
                  <div className="p-2 bg-accent-blue/20 rounded-lg text-accent-blue group-hover:scale-110 transition-transform">
                    <TrendingUp size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white">Criar task mais difícil</p>
                    <p className="text-xs text-text-sec">Aumentar intensidade em 30-50%</p>
                  </div>
                </button>

                <button
                  onClick={handleSelectKPI}
                  className="w-full flex items-center gap-4 p-4 bg-bg-sec hover:bg-accent-purple/10 border border-border-subtle hover:border-accent-purple/50 rounded-xl transition-all group"
                >
                  <div className="p-2 bg-accent-purple/20 rounded-lg text-accent-purple group-hover:scale-110 transition-transform">
                    <BarChart3 size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white">Criar novo KPI</p>
                    <p className="text-xs text-text-sec">Medir consistência a longo prazo</p>
                  </div>
                </button>

                <button
                  onClick={handleClose}
                  className="w-full p-3 text-sm text-text-sec hover:text-white transition-colors"
                >
                  Agora não, obrigado
                </button>
              </div>
            )}

            {step === 'preview_task' && suggestedTask && (
              <div className="space-y-6">
                <div className="bg-bg-sec/50 p-4 rounded-xl border border-border-subtle">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded">Sugestão de Evolução</span>
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-text-sec hover:text-white transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <input 
                        type="text"
                        value={suggestedTask.titulo}
                        onChange={(e) => setSuggestedTask({...suggestedTask, titulo: e.target.value})}
                        className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-white focus:border-accent-blue outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          value={suggestedTask.duracao}
                          onChange={(e) => setSuggestedTask({...suggestedTask, duracao: parseInt(e.target.value)})}
                          className="w-20 bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-white focus:border-accent-blue outline-none"
                        />
                        <span className="text-sm text-text-sec">minutos</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-lg font-bold text-white mb-1">{suggestedTask.titulo}</h4>
                      <div className="flex items-center gap-3 text-sm text-text-sec">
                        <span className="flex items-center gap-1">
                          <Plus size={14} className="text-accent-blue" />
                          {suggestedTask.duracao} min
                        </span>
                        {suggestedTask.metaVinculada && (
                          <span className="flex items-center gap-1">
                            <TrendingUp size={14} className="text-accent-purple" />
                            Vinculada à meta
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('initial')}
                    className="flex-1 px-4 py-3 bg-bg-sec border border-border-subtle text-text-sec hover:text-white rounded-xl transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleConfirmTask}
                    className="flex-1 px-4 py-3 bg-accent-blue hover:bg-accent-blue/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-accent-blue/20 flex items-center justify-center gap-2"
                  >
                    <Check size={20} />
                    Confirmar
                  </button>
                </div>
              </div>
            )}

            {step === 'preview_kpi' && suggestedKPI && (
              <div className="space-y-6">
                <div className="bg-bg-sec/50 p-4 rounded-xl border border-border-subtle">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-accent-purple bg-accent-purple/10 px-2 py-0.5 rounded">Sugestão de KPI</span>
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-text-sec hover:text-white transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <input 
                        type="text"
                        value={suggestedKPI.titulo}
                        onChange={(e) => setSuggestedKPI({...suggestedKPI, titulo: e.target.value})}
                        className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-white focus:border-accent-purple outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          value={suggestedKPI.valorMeta}
                          onChange={(e) => setSuggestedKPI({...suggestedKPI, valorMeta: parseInt(e.target.value)})}
                          className="w-20 bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-white focus:border-accent-purple outline-none"
                        />
                        <span className="text-sm text-text-sec">{suggestedKPI.unidade}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-lg font-bold text-white mb-1">{suggestedKPI.titulo}</h4>
                      <p className="text-sm text-text-sec">
                        Meta: <span className="text-white font-bold">{suggestedKPI.valorMeta}</span> {suggestedKPI.unidade} por semana
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('initial')}
                    className="flex-1 px-4 py-3 bg-bg-sec border border-border-subtle text-text-sec hover:text-white rounded-xl transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleConfirmKPI}
                    className="flex-1 px-4 py-3 bg-accent-purple hover:bg-accent-purple/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-accent-purple/20 flex items-center justify-center gap-2"
                  >
                    <Check size={20} />
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
