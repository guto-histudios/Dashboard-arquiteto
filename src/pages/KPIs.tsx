import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { KPICard } from '../components/kpis/KPICard';
import { KPIForm } from '../components/kpis/KPIForm';
import { KPIGeneratorModal } from '../components/kpis/KPIGeneratorModal';
import { Plus, Activity, Sparkles } from 'lucide-react';
import { KPI } from '../types';

export function KPIs() {
  const { kpis, adicionarKPI, atualizarKPI, editarKPI, removerKPI } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPI | undefined>(undefined);

  const handleSaveGeneratedKPIs = (newKpis: KPI[]) => {
    newKpis.forEach(kpi => adicionarKPI(kpi));
  };

  const handleEdit = (kpi: KPI) => {
    setEditingKPI(kpi);
    setIsFormOpen(true);
  };

  const handleSave = (kpi: KPI) => {
    if (editingKPI) {
      editarKPI(kpi);
    } else {
      adicionarKPI(kpi);
    }
    setIsFormOpen(false);
    setEditingKPI(undefined);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este KPI?')) {
      removerKPI(id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingKPI(undefined);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent-purple/10 rounded-xl">
            <Activity size={28} className="text-accent-purple" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Meus KPIs</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsGeneratorOpen(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Sparkles size={20} className="text-accent-purple" />
            Gerar com IA
          </button>
          <button 
            onClick={() => {
              setEditingKPI(undefined);
              setIsFormOpen(true);
            }}
            className="bg-gradient-to-r from-accent-purple to-pink-600 text-white font-medium px-6 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent-purple/25 active:scale-95 flex items-center gap-2"
          >
            <Plus size={20} />
            Criar Manualmente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.length > 0 ? (
          kpis.map(kpi => (
            <KPICard 
              key={kpi.id} 
              kpi={kpi} 
              onUpdate={atualizarKPI} 
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="col-span-full glass-card flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-bg-sec rounded-full flex items-center justify-center mb-6 border border-border-subtle">
              <Activity size={40} className="text-text-sec" />
            </div>
            <h3 className="text-xl font-medium mb-2">Nenhum KPI definido</h3>
            <p className="text-text-sec max-w-md">Os Key Performance Indicators ajudam a medir seu progresso. Crie o primeiro ou gere com IA!</p>
          </div>
        )}
      </div>

      {isFormOpen && (
        <KPIForm 
          kpi={editingKPI}
          onSave={handleSave}
          onCancel={handleCloseForm}
        />
      )}

      {isGeneratorOpen && (
        <KPIGeneratorModal
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
          onSave={handleSaveGeneratedKPIs}
        />
      )}
    </div>
  );
}

