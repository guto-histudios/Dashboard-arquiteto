import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { X, Sparkles, Check, Trash2, Edit2 } from 'lucide-react';
import { generateKPIs } from '../../services/geminiService';
import { KPI } from '../../types';

interface KPIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (kpis: KPI[]) => void;
}

export function KPIGeneratorModal({ isOpen, onClose, onSave }: KPIGeneratorModalProps) {
  const { userProfile, habitos, metas } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedKPIs, setSuggestedKPIs] = useState<KPI[]>([]);
  const [selectedKPIs, setSelectedKPIs] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleGenerate();
    } else {
      setSuggestedKPIs([]);
      setSelectedKPIs(new Set());
      setEditingId(null);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const kpis = await generateKPIs(userProfile, habitos, metas);
      setSuggestedKPIs(kpis);
      setSelectedKPIs(new Set(kpis.map(k => k.id)));
    } catch (error) {
      console.error("Failed to generate KPIs", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedKPIs);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedKPIs(newSelection);
  };

  const handleUpdateKPI = (id: string, field: keyof KPI, value: any) => {
    setSuggestedKPIs(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
  };

  const handleSave = () => {
    const kpisToSave = suggestedKPIs.filter(k => selectedKPIs.has(k.id));
    onSave(kpisToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-bg-main border border-border-subtle w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
        
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-bg-sec/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-purple/10 rounded-xl">
              <Sparkles size={24} className="text-accent-purple" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Gerar KPIs com IA</h2>
              <p className="text-sm text-text-sec">Analisando seus objetivos, hábitos e metas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-sec hover:text-white hover:bg-bg-main rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-bg-main">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 border-4 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin mb-4"></div>
              <h3 className="text-lg font-medium text-white mb-2">A IA está analisando seu perfil...</h3>
              <p className="text-text-sec text-sm max-w-md">Criando indicadores mensuráveis para acompanhar seu progresso.</p>
            </div>
          ) : suggestedKPIs.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-text-sec mb-4">Selecione os KPIs que deseja adicionar ao seu dashboard. Você pode editá-los antes de salvar.</p>
              
              {suggestedKPIs.map(kpi => {
                const isSelected = selectedKPIs.has(kpi.id);
                const isEditing = editingId === kpi.id;

                return (
                  <div 
                    key={kpi.id}
                    className={`border rounded-xl p-4 transition-all ${isSelected ? 'border-accent-purple bg-accent-purple/5' : 'border-border-subtle bg-bg-sec/30 opacity-70'}`}
                  >
                    <div className="flex items-start gap-4">
                      <button 
                        onClick={() => toggleSelection(kpi.id)}
                        className={`mt-1 w-5 h-5 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-accent-purple text-white' : 'border border-text-sec'}`}
                      >
                        {isSelected && <Check size={14} />}
                      </button>
                      
                      <div className="flex-1 space-y-3">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-text-sec mb-1">Título</label>
                              <input 
                                value={kpi.titulo}
                                onChange={e => handleUpdateKPI(kpi.id, 'titulo', e.target.value)}
                                className="input-modern w-full py-1.5 px-3 text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-text-sec mb-1">Meta</label>
                                <input 
                                  type="number"
                                  value={kpi.valorMeta}
                                  onChange={e => handleUpdateKPI(kpi.id, 'valorMeta', Number(e.target.value))}
                                  className="input-modern w-full py-1.5 px-3 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-text-sec mb-1">Unidade</label>
                                <input 
                                  value={kpi.unidade}
                                  onChange={e => handleUpdateKPI(kpi.id, 'unidade', e.target.value)}
                                  className="input-modern w-full py-1.5 px-3 text-sm"
                                />
                              <div>
                                <label className="block text-xs text-text-sec mb-1">Frequência</label>
                                <select 
                                  value={kpi.frequencia || 'semanal'}
                                  onChange={e => handleUpdateKPI(kpi.id, 'frequencia', e.target.value)}
                                  className="input-modern w-full py-1.5 px-3 text-sm appearance-none"
                                >
                                  <option value="diario">Diário</option>
                                  <option value="semanal">Semanal</option>
                                  <option value="mensal">Mensal</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-text-sec mb-1">Como medir</label>
                              <input 
                                value={kpi.descricao || ''}
                                onChange={e => handleUpdateKPI(kpi.id, 'descricao', e.target.value)}
                                className="input-modern w-full py-1.5 px-3 text-sm"
                              />
                            </div>
                            <div className="flex justify-end pt-2">
                              <button 
                                onClick={() => setEditingId(null)}
                                className="text-xs bg-bg-main border border-border-subtle px-3 py-1.5 rounded-lg hover:bg-bg-sec"
                              >
                                Concluir Edição
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className={`font-bold ${isSelected ? 'text-white' : 'text-text-main'}`}>{kpi.titulo}</h3>
                              <button 
                                onClick={() => setEditingId(kpi.id)}
                                className="text-text-sec hover:text-white p-1"
                              >
                                <Edit2 size={14} />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-1 mb-2">
                              <span className="text-xs font-medium bg-bg-main border border-border-subtle px-2 py-0.5 rounded text-accent-purple">
                                Meta: {kpi.valorMeta} {kpi.unidade}
                              </span>
                            </div>
                            {kpi.descricao && (
                              <p className="text-xs text-text-sec leading-relaxed">{kpi.descricao}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-sec">Nenhum KPI gerado. Tente novamente.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border-subtle bg-bg-sec/50 flex justify-between items-center">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="text-sm text-text-sec hover:text-white flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-main transition-colors"
          >
            <Sparkles size={16} />
            Regerar
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-bg-main border border-border-subtle text-white hover:bg-bg-sec transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isGenerating || selectedKPIs.size === 0}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-accent-purple text-white hover:bg-accent-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar Selecionados ({selectedKPIs.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
