import React, { useState, useEffect } from 'react';
import { KPI } from '../../types';
import { X, Save, Calculator, Target, Calendar, BarChart2 } from 'lucide-react';
import { clsx } from 'clsx';
import { getDataStringBrasil } from '../../utils/dataUtils';

interface KPIFormProps {
  kpi?: KPI;
  onSave: (kpi: KPI) => void;
  onCancel: () => void;
}

export function KPIForm({ kpi, onSave, onCancel }: KPIFormProps) {
  const [formData, setFormData] = useState<Partial<KPI>>({
    titulo: '',
    descricao: '',
    valorAtual: 0,
    valorMeta: 10,
    unidade: '',
    tipoCalculo: 'manual',
    frequencia: 'diario',
    dataInicio: getDataStringBrasil(),
    historico: []
  });

  useEffect(() => {
    if (kpi) {
      setFormData(kpi);
    }
  }, [kpi]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.valorMeta) return;

    onSave({
      id: kpi?.id || crypto.randomUUID(),
      titulo: formData.titulo,
      descricao: formData.descricao || '',
      valorAtual: formData.valorAtual || 0,
      valorMeta: Number(formData.valorMeta),
      unidade: formData.unidade || '',
      tipoCalculo: formData.tipoCalculo as 'manual' | 'automatico',
      tipoAutomatico: formData.tipoAutomatico,
      frequencia: formData.frequencia as 'diario' | 'semanal' | 'mensal',
      dataInicio: formData.dataInicio || getDataStringBrasil(),
      historico: formData.historico || []
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-main border border-border-subtle rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-border-subtle">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="text-accent-blue" />
            {kpi ? 'Editar KPI' : 'Novo KPI'}
          </h2>
          <button onClick={onCancel} className="text-text-sec hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-sec mb-1">Título</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={e => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                className="input-modern w-full"
                placeholder="Ex: Horas de Estudo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-sec mb-1">Descrição (Opcional)</label>
              <textarea
                value={formData.descricao}
                onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                className="input-modern w-full min-h-[80px]"
                placeholder="Detalhes sobre este indicador..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-sec mb-1">Meta</label>
                <div className="relative">
                  <Target size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" />
                  <input
                    type="number"
                    value={formData.valorMeta}
                    onChange={e => setFormData(prev => ({ ...prev, valorMeta: Number(e.target.value) }))}
                    className="input-modern w-full pl-10"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-sec mb-1">Unidade</label>
                <input
                  type="text"
                  value={formData.unidade}
                  onChange={e => setFormData(prev => ({ ...prev, unidade: e.target.value }))}
                  className="input-modern w-full"
                  placeholder="Ex: horas, %, kg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-sec mb-1">Tipo de Cálculo</label>
                <div className="relative">
                  <Calculator size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" />
                  <select
                    value={formData.tipoCalculo}
                    onChange={e => setFormData(prev => ({ ...prev, tipoCalculo: e.target.value as any }))}
                    className="input-modern w-full pl-10 appearance-none"
                  >
                    <option value="manual">Manual</option>
                    <option value="automatico">Automático</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-sec mb-1">Frequência</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" />
                  <select
                    value={formData.frequencia}
                    onChange={e => setFormData(prev => ({ ...prev, frequencia: e.target.value as any }))}
                    className="input-modern w-full pl-10 appearance-none"
                  >
                    <option value="diario">Diário</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>
              </div>
            </div>

            {formData.tipoCalculo === 'automatico' && (
              <div className="bg-bg-sec/50 p-4 rounded-xl border border-border-subtle animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-text-sec mb-2">Fonte de Dados</label>
                <select
                  value={formData.tipoAutomatico}
                  onChange={e => setFormData(prev => ({ ...prev, tipoAutomatico: e.target.value as any }))}
                  className="input-modern w-full"
                >
                  <option value="">Selecione uma fonte...</option>
                  <option value="tasks_concluidas">Tasks Concluídas (Hoje)</option>
                  <option value="habitos_concluidos">Hábitos Concluídos (Hoje)</option>
                  <option value="pomodoro_tempo">Tempo de Foco (Pomodoro)</option>
                  <option value="xp_ganho">Total de XP</option>
                  <option value="streak_atual">Streak Atual</option>
                </select>
                <p className="text-xs text-text-sec mt-2">
                  O valor será atualizado automaticamente com base na sua atividade.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-text-sec hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-accent-blue hover:bg-accent-blue/90 text-white px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-all active:scale-95"
            >
              <Save size={18} />
              Salvar KPI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
