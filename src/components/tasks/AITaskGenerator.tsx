import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, Check, X, Plus, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { generateTasksFromDescription } from '../../services/geminiService';
import { Task } from '../../types';

export function AITaskGenerator() {
  const { tasks, metas, userProfile, adicionarTask, atualizarMeta } = useApp();
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<Task[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    try {
      const result = await generateTasksFromDescription(description, {
        tasks,
        metas,
        userProfile
      });
      setSuggestedTasks(result);
      setShowResults(true);
    } catch (error) {
      console.error("Erro ao gerar tasks:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptAll = () => {
    suggestedTasks.forEach(task => {
      const success = adicionarTask(task);
      if (!success) return;
      
      // If linked to a meta, update the meta
      if (task.metaVinculada) {
        const meta = metas.find(m => m.id === task.metaVinculada);
        if (meta) {
          atualizarMeta(meta.id, {
            tasksVinculadas: [...(meta.tasksVinculadas || []), task.id]
          });
        }
      }
    });
    reset();
  };

  const handleAcceptSingle = (task: Task) => {
    const success = adicionarTask(task);
    if (!success) return;
    
    if (task.metaVinculada) {
      const meta = metas.find(m => m.id === task.metaVinculada);
      if (meta) {
        atualizarMeta(meta.id, {
          tasksVinculadas: [...(meta.tasksVinculadas || []), task.id]
        });
      }
    }
    setSuggestedTasks(prev => prev.filter(t => t.id !== task.id));
    if (suggestedTasks.length <= 1) {
      reset();
    }
  };

  const handleRemoveSuggested = (id: string) => {
    setSuggestedTasks(prev => prev.filter(t => t.id !== id));
    if (suggestedTasks.length <= 1) {
      reset();
    }
  };

  const reset = () => {
    setDescription('');
    setSuggestedTasks([]);
    setShowResults(false);
  };

  return (
    <div className="glass-card p-6 border border-accent-blue/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 rounded-bl-full -z-10"></div>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-accent-blue/10 rounded-lg">
          <Sparkles className="text-accent-blue" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Gerador de Tasks IA</h3>
          <p className="text-xs text-text-sec font-medium">Descreva seu progresso ou planos e eu crio as tarefas para você.</p>
        </div>
      </div>

      {!showResults ? (
        <div className="space-y-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Finalizei o roteiro do vídeo de React, agora vou começar a gravar as aulas..."
            className="w-full bg-bg-sec border border-border-subtle rounded-xl px-4 py-3 text-text-main placeholder-text-sec focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue resize-none h-32 transition-all"
          />
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !description.trim()}
              className="bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-accent-blue/20"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Gerar Tasks
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-text-sec uppercase tracking-wider">Sugestões da IA</h4>
            <button onClick={reset} className="text-text-sec hover:text-white text-xs flex items-center gap-1">
              <X size={14} /> Cancelar
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {suggestedTasks.map((task) => (
              <div key={task.id} className="bg-bg-sec/50 border border-border-subtle rounded-xl p-4 flex items-center justify-between group hover:border-accent-blue/30 transition-all">
                <div className="flex-1">
                  <h5 className="font-bold text-white text-sm">{task.titulo}</h5>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-text-sec flex items-center gap-1">
                      <Plus size={10} /> {task.duracao} min
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold
                      ${task.categoria === 'trabalho' ? 'bg-accent-blue/10 text-accent-blue' : 
                        task.categoria === 'estudos' ? 'bg-accent-purple/10 text-accent-purple' :
                        task.categoria === 'saude' ? 'bg-success/10 text-success' : 'bg-gray-500/10 text-gray-400'}
                    `}>
                      {task.categoria}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleRemoveSuggested(task.id)}
                    className="p-2 text-text-sec hover:text-error transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleAcceptSingle(task)}
                    className="p-2 bg-accent-blue/10 text-accent-blue hover:bg-accent-blue hover:text-white rounded-lg transition-all"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={reset}
              className="flex-1 px-4 py-2.5 bg-bg-sec border border-border-subtle text-text-sec hover:text-white rounded-xl font-bold transition-all"
            >
              Recusar Todas
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex-1 px-4 py-2.5 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-accent-blue/20 flex items-center justify-center gap-2"
            >
              <Check size={20} />
              Aceitar Todas
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
