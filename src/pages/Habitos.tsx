import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { HabitoCard } from '../components/habitos/HabitoCard';
import { HabitoForm } from '../components/habitos/HabitoForm';
import { AIHabitGenerator } from '../components/habitos/AIHabitGenerator';
import { Plus, Calendar, Sparkles } from 'lucide-react';

export function Habitos() {
  const { habitos, adicionarHabito, toggleConclusaoHabito } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-success/10 rounded-xl">
            <Calendar size={28} className="text-success" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Meus Hábitos</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAIGeneratorOpen(true)}
            className="bg-gradient-to-r from-accent-purple to-indigo-600 text-white font-medium px-6 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent-purple/25 active:scale-95 flex items-center gap-2"
          >
            <Sparkles size={20} />
            Gerar com IA
          </button>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-gradient-to-r from-success to-emerald-600 text-white font-medium px-6 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-success/25 active:scale-95 flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Hábito
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habitos.length > 0 ? (
          habitos.map(habito => (
            <HabitoCard key={habito.id} habito={habito} onToggle={toggleConclusaoHabito} />
          ))
        ) : (
          <div className="col-span-full glass-card flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-bg-sec rounded-full flex items-center justify-center mb-6 border border-border-subtle">
              <Calendar size={40} className="text-text-sec" />
            </div>
            <h3 className="text-xl font-medium mb-2">Nenhum hábito rastreado</h3>
            <p className="text-text-sec max-w-md">Comece a construir sua rotina adicionando seu primeiro hábito diário.</p>
          </div>
        )}
      </div>

      {isFormOpen && (
        <HabitoForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          onSave={adicionarHabito} 
        />
      )}

      {isAIGeneratorOpen && (
        <AIHabitGenerator
          isOpen={isAIGeneratorOpen}
          onClose={() => setIsAIGeneratorOpen(false)}
        />
      )}
    </div>
  );
}

