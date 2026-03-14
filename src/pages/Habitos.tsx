import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { HabitoCard } from '../components/habitos/HabitoCard';
import { HabitoForm } from '../components/habitos/HabitoForm';
import { AIHabitGenerator } from '../components/habitos/AIHabitGenerator';
import { Plus, Calendar, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function Habitos() {
  const { habitos, adicionarHabito, toggleConclusaoHabito } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-success/10 rounded-xl">
            <Calendar size={28} className="text-success" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-serif font-bold tracking-tight text-text-main">Meus Hábitos</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsAIGeneratorOpen(true)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Sparkles size={20} strokeWidth={1.5} />
            Gerar com IA
          </Button>
          <Button 
            onClick={() => setIsFormOpen(true)}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Plus size={20} strokeWidth={1.5} />
            Novo Hábito
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habitos.length > 0 ? (
          habitos.map(habito => (
            <HabitoCard key={habito.id} habito={habito} onToggle={toggleConclusaoHabito} />
          ))
        ) : (
          <Card className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-bg-sec rounded-full flex items-center justify-center mb-6 border border-border-subtle">
              <Calendar size={40} className="text-text-sec" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-serif font-medium mb-2 text-text-main">Nenhum hábito rastreado</h3>
            <p className="text-text-sec max-w-md">Comece a construir sua rotina adicionando seu primeiro hábito diário.</p>
          </Card>
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

