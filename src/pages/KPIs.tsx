import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { KPICard } from '../components/kpis/KPICard';
import { KPIForm } from '../components/kpis/KPIForm';
import { KPIGeneratorModal } from '../components/kpis/KPIGeneratorModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Plus, Activity, Sparkles } from 'lucide-react';
import { KPI } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function KPIs() {
  const { kpis, adicionarKPI, atualizarKPI, editarKPI, removerKPI } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPI | undefined>(undefined);
  const [kpiToDelete, setKpiToDelete] = useState<string | null>(null);

  const chartData = kpis.map(kpi => ({
    name: kpi.titulo,
    progresso: Math.min((kpi.valorAtual / kpi.valorMeta) * 100, 100)
  }));

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
    setKpiToDelete(id);
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

      {kpis.length > 0 && (
        <div className="card p-6 h-64">
          <h3 className="text-lg font-semibold mb-4">Progresso Geral</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="progresso" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.progresso >= 100 ? '#10b981' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

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

      <ConfirmModal
        isOpen={!!kpiToDelete}
        title="Excluir KPI"
        message="Tem certeza que deseja excluir este KPI? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => {
          if (kpiToDelete) {
            removerKPI(kpiToDelete);
            setKpiToDelete(null);
          }
        }}
        onCancel={() => setKpiToDelete(null)}
      />
    </div>
  );
}

