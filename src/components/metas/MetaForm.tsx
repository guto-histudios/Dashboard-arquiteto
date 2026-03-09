import React, { useState, useEffect } from 'react';
import { Meta, MetaPeriodo } from '../../types';
import { X, Link as LinkIcon, Search, Plus, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getDataStringBrasil } from '../../utils/dataUtils';
import { useApp } from '../../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface MetaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meta: Meta) => void;
  metaToEdit?: Meta | null;
}

export function MetaForm({ isOpen, onClose, onSave, metaToEdit }: MetaFormProps) {
  const { tasks, kpis } = useApp();
  const navigate = useNavigate();
  
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [periodo, setPeriodo] = useState<MetaPeriodo>('semanal');
  const [dataInicio, setDataInicio] = useState(getDataStringBrasil());
  const [dataFim, setDataFim] = useState(getDataStringBrasil());
  const [metaProgresso, setMetaProgresso] = useState(100);
  
  const [taskId, setTaskId] = useState<string>('');
  const [kpiId, setKpiId] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Search states
  const [taskSearch, setTaskSearch] = useState('');
  const [kpiSearch, setKpiSearch] = useState('');

  useEffect(() => {
    if (metaToEdit && isOpen) {
      setTitulo(metaToEdit.titulo);
      setDescricao(metaToEdit.descricao || '');
      setPeriodo(metaToEdit.periodo);
      setDataInicio(metaToEdit.dataInicio);
      setDataFim(metaToEdit.dataFim);
      setMetaProgresso(metaToEdit.metaProgresso || 100);
      setTaskId(metaToEdit.tasksVinculadas?.[0] || '');
      setKpiId(metaToEdit.kpiVinculado || '');
      setError('');
    } else if (isOpen) {
      // Reset form when opening for a new meta
      setTitulo('');
      setDescricao('');
      setPeriodo('semanal');
      setDataInicio(getDataStringBrasil());
      setDataFim(getDataStringBrasil());
      setMetaProgresso(100);
      setTaskId('');
      setKpiId('');
      setError('');
      setTaskSearch('');
      setKpiSearch('');
    }
  }, [metaToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskId && !kpiId) {
      setError('É obrigatório vincular pelo menos uma KPI ou Task.');
      return;
    }
    
    setError('');

    const newMeta: Meta = {
      id: metaToEdit ? metaToEdit.id : uuidv4(),
      titulo,
      descricao,
      periodo,
      dataInicio,
      dataFim,
      progresso: metaToEdit ? metaToEdit.progresso : 0,
      status: metaToEdit ? metaToEdit.status : 'nao_iniciada',
      metaProgresso,
      tasksVinculadas: taskId ? [taskId] : [],
      kpiVinculado: kpiId || undefined,
      ehIkigai: metaToEdit ? metaToEdit.ehIkigai : false,
      ehShokunin: metaToEdit ? metaToEdit.ehShokunin : false,
    };
    onSave(newMeta);
    onClose();
  };

  const filteredTasks = tasks.filter(t => t.titulo.toLowerCase().includes(taskSearch.toLowerCase()));
  const filteredKpis = kpis.filter(k => k.titulo.toLowerCase().includes(kpiSearch.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-border-subtle sticky top-0 bg-bg-card/95 backdrop-blur-sm z-10">
          <h2 className="text-xl font-bold tracking-tight">{metaToEdit ? 'Editar Meta' : 'Nova Meta'}</h2>
          <button onClick={onClose} className="text-text-sec hover:text-white transition-colors p-2 hover:bg-bg-sec rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Título</label>
                <input 
                  required
                  value={titulo} 
                  onChange={(e) => setTitulo(e.target.value)} 
                  className="input-modern w-full"
                  placeholder="Ex: Correr 10km"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Descrição</label>
                <textarea 
                  value={descricao} 
                  onChange={(e) => setDescricao(e.target.value)} 
                  className="input-modern w-full min-h-[80px] resize-y"
                  placeholder="Detalhes adicionais..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-sec">Período</label>
                  <select 
                    value={periodo} 
                    onChange={(e) => setPeriodo(e.target.value as MetaPeriodo)} 
                    className="input-modern w-full appearance-none"
                  >
                    <option value="semanal">Semanal</option>
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-sec">Meta (Valor)</label>
                  <input 
                    type="number"
                    required
                    value={metaProgresso} 
                    onChange={(e) => setMetaProgresso(Number(e.target.value))} 
                    className="input-modern w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-sec">Início</label>
                  <input 
                    type="date"
                    required
                    value={dataInicio} 
                    onChange={(e) => setDataInicio(e.target.value)} 
                    className="input-modern w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-sec">Fim</label>
                  <input 
                    type="date"
                    required
                    value={dataFim} 
                    onChange={(e) => setDataFim(e.target.value)} 
                    className="input-modern w-full"
                  />
                </div>
              </div>
            </div>

            <div className="bg-bg-sec/30 border border-border-subtle p-5 rounded-xl space-y-5 h-fit">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <LinkIcon size={16} className="text-accent-blue" />
                Vinculação (Obrigatório)
              </h3>
              
              {/* Tasks Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-sec uppercase">Vincular Task</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" />
                  <input 
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Buscar task..."
                    className="input-modern w-full pl-9 py-2 text-sm"
                  />
                </div>
                
                <div className="max-h-32 overflow-y-auto border border-border-subtle rounded-lg bg-bg-main/50 p-1 space-y-1">
                  <div 
                    onClick={() => setTaskId('')}
                    className={`p-2 rounded-md cursor-pointer text-sm flex items-center gap-2 ${!taskId ? 'bg-accent-blue/20 text-accent-blue font-medium' : 'text-text-sec hover:bg-bg-sec'}`}
                  >
                    <div className={`w-3 h-3 rounded-full border ${!taskId ? 'border-accent-blue bg-accent-blue' : 'border-text-sec'}`}></div>
                    Nenhuma
                  </div>
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map(t => (
                      <div 
                        key={t.id} 
                        onClick={() => {
                          setTaskId(t.id);
                          setError('');
                        }}
                        className={`p-2 rounded-md cursor-pointer text-sm flex items-center gap-2 ${taskId === t.id ? 'bg-accent-blue/20 text-accent-blue font-medium' : 'text-white hover:bg-bg-sec'}`}
                      >
                        <div className={`w-3 h-3 rounded-full border ${taskId === t.id ? 'border-accent-blue bg-accent-blue' : 'border-text-sec'}`}></div>
                        <span className="truncate">{t.titulo}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center">
                      <p className="text-xs text-text-sec mb-2">Nenhuma task encontrada</p>
                      <button 
                        type="button"
                        onClick={() => navigate('/tasks')}
                        className="text-xs text-accent-blue hover:underline flex items-center justify-center gap-1 w-full"
                      >
                        <Plus size={12} /> Criar nova Task
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* KPIs Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-sec uppercase">Vincular KPI</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec" />
                  <input 
                    value={kpiSearch}
                    onChange={(e) => setKpiSearch(e.target.value)}
                    placeholder="Buscar KPI..."
                    className="input-modern w-full pl-9 py-2 text-sm"
                  />
                </div>
                
                <div className="max-h-32 overflow-y-auto border border-border-subtle rounded-lg bg-bg-main/50 p-1 space-y-1">
                  <div 
                    onClick={() => setKpiId('')}
                    className={`p-2 rounded-md cursor-pointer text-sm flex items-center gap-2 ${!kpiId ? 'bg-accent-blue/20 text-accent-blue font-medium' : 'text-text-sec hover:bg-bg-sec'}`}
                  >
                    <div className={`w-3 h-3 rounded-full border ${!kpiId ? 'border-accent-blue bg-accent-blue' : 'border-text-sec'}`}></div>
                    Nenhuma
                  </div>
                  {filteredKpis.length > 0 ? (
                    filteredKpis.map(k => (
                      <div 
                        key={k.id} 
                        onClick={() => {
                          setKpiId(k.id);
                          setError('');
                        }}
                        className={`p-2 rounded-md cursor-pointer text-sm flex items-center gap-2 ${kpiId === k.id ? 'bg-accent-blue/20 text-accent-blue font-medium' : 'text-white hover:bg-bg-sec'}`}
                      >
                        <div className={`w-3 h-3 rounded-full border ${kpiId === k.id ? 'border-accent-blue bg-accent-blue' : 'border-text-sec'}`}></div>
                        <span className="truncate">{k.titulo}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center">
                      <p className="text-xs text-text-sec mb-2">Nenhum KPI encontrado</p>
                      <button 
                        type="button"
                        onClick={() => navigate('/kpis')}
                        className="text-xs text-accent-blue hover:underline flex items-center justify-center gap-1 w-full"
                      >
                        <Plus size={12} /> Criar novo KPI
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border-subtle mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="btn-primary"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

