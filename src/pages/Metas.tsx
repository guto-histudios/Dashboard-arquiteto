import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { MetaCard } from '../components/metas/MetaCard';
import { MetaForm } from '../components/metas/MetaForm';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { PlanoTrimestralWidget } from '../components/dashboard/PlanoTrimestralWidget';
import { Plus, Target, Sparkles, Archive, History, AlertTriangle } from 'lucide-react';
import { generateMetas, generateHarderMeta } from '../services/geminiService';
import { Meta, Task, KPI } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getDataStringBrasil } from '../utils/dataUtils';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function Metas() {
  const { metas, adicionarMeta, atualizarMeta, removerMeta, userProfile, tasks, kpis, adicionarTask, adicionarKPI } = useApp();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [metaToEdit, setMetaToEdit] = useState<Meta | null>(null);
  const [metaToDelete, setMetaToDelete] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeMetas = metas.filter(m => !m.arquivada);
  const archivedMetas = metas.filter(m => m.arquivada);

  const semanais = activeMetas.filter(m => m.periodo === 'semanal');
  const mensais = activeMetas.filter(m => m.periodo === 'mensal');
  const trimestrais = activeMetas.filter(m => m.periodo === 'trimestral');

  const archivedSuccess = archivedMetas.filter(m => m.resultado === 'sucesso');
  const archivedFailure = archivedMetas.filter(m => m.resultado === 'falha');

  const isLocked = tasks.length === 0 || kpis.length === 0;

  // Auto-generate if empty
  useEffect(() => {
    const autoGenerate = async () => {
      if (metas.length === 0 && !isGenerating && !isLocked) {
        setIsGenerating(true);
        try {
          const novasMetas = await generateMetas(userProfile, tasks, kpis);
          
          novasMetas.forEach((m: any) => {
            let metaToSave = { ...m };
            
            // Auto-create linked Task or KPI if suggested
            if (m.vinculoExistente) {
              if (m.vinculoExistente.tipo === 'task') {
                metaToSave.tasksVinculadas = [m.vinculoExistente.id];
              } else if (m.vinculoExistente.tipo === 'kpi') {
                metaToSave.kpiVinculado = m.vinculoExistente.id;
              }
              delete metaToSave.vinculoExistente;
            } else if (m.sugestaoVinculo) {
              if (m.sugestaoVinculo.tipo === 'task') {
                const newTask: Task = {
                  id: uuidv4(),
                  titulo: m.sugestaoVinculo.titulo,
                  descricao: m.sugestaoVinculo.descricao,
                  duracao: 30,
                  categoria: 'pessoal',
                  prioridade: 'media',
                  status: 'nao_iniciada',
                  data: getDataStringBrasil(),
                  tipoRepeticao: m.periodo === 'semanal' ? 'diaria' : 'semanal',
                  vezAtual: 1,
                  xpGanho: false,
                  pomodorosFeitos: 0,
                };
                adicionarTask(newTask);
                metaToSave.tasksVinculadas = [newTask.id];
              } else if (m.sugestaoVinculo.tipo === 'kpi') {
                const newKpi: KPI = {
                  id: uuidv4(),
                  titulo: m.sugestaoVinculo.titulo,
                  valorAtual: 0,
                  valorMeta: m.metaProgresso,
                  unidade: m.sugestaoVinculo.descricao || 'un',
                  tipoCalculo: 'manual',
                  frequencia: m.periodo,
                  dataInicio: getDataStringBrasil(),
                  historico: []
                };
                adicionarKPI(newKpi);
                metaToSave.kpiVinculado = newKpi.id;
              }
              delete metaToSave.sugestaoVinculo;
            }

            adicionarMeta(metaToSave);
          });
        } catch (error) {
          console.error("Failed to auto-generate metas", error);
        } finally {
          setIsGenerating(false);
        }
      }
    };
    
    // Only auto-generate once when the component mounts and metas is empty
    const timer = setTimeout(() => {
      if (metas.length === 0 && !isLocked) autoGenerate();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [metas.length, userProfile, isLocked]);

  const handleUpdateMeta = async (id: string, updates: Partial<Meta>) => {
    atualizarMeta(id, updates);

    // Kaizen: If marked as completed, generate a harder one
    if (updates.status === 'concluida') {
      const metaConcluida = metas.find(m => m.id === id);
      if (metaConcluida) {
        try {
          // Wait a bit so the user sees the completion animation
          setTimeout(async () => {
            const novaMeta = await generateHarderMeta({ ...metaConcluida, ...updates }, userProfile);
            adicionarMeta(novaMeta);
            alert(`Parabéns! Uma nova meta ${novaMeta.periodo} mais desafiadora foi gerada (Kaizen).`);
          }, 1500);
        } catch (error) {
          console.error("Failed to generate harder meta", error);
        }
      }
    }
  };

  const handleDeleteMeta = (id: string) => {
    setMetaToDelete(id);
  };

  const handleEditMeta = (meta: Meta) => {
    setMetaToEdit(meta);
    setIsFormOpen(true);
  };

  const handleSaveMeta = (meta: Meta) => {
    if (metaToEdit) {
      atualizarMeta(meta.id, meta);
    } else {
      adicionarMeta(meta);
    }
    setMetaToEdit(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setMetaToEdit(null);
  };

  const handleGenerateAI = async () => {
    if (isLocked) {
      alert("Para gerar metas, você precisa ter pelo menos 1 KPI e 1 Task cadastrada.");
      return;
    }

    setIsGenerating(true);
    try {
      const novasMetas = await generateMetas(userProfile, tasks, kpis);
      
      novasMetas.forEach((m: any) => {
        let metaToSave = { ...m };
        
        // Auto-create linked Task or KPI if suggested
        if (m.vinculoExistente) {
          if (m.vinculoExistente.tipo === 'task') {
            metaToSave.tasksVinculadas = [m.vinculoExistente.id];
          } else if (m.vinculoExistente.tipo === 'kpi') {
            metaToSave.kpiVinculado = m.vinculoExistente.id;
          }
          delete metaToSave.vinculoExistente;
        } else if (m.sugestaoVinculo) {
          if (m.sugestaoVinculo.tipo === 'task') {
            const newTask: Task = {
              id: uuidv4(),
              titulo: m.sugestaoVinculo.titulo,
              descricao: m.sugestaoVinculo.descricao,
              duracao: 30,
              categoria: 'pessoal',
              prioridade: 'media',
              status: 'nao_iniciada',
              data: getDataStringBrasil(),
              tipoRepeticao: m.periodo === 'semanal' ? 'diaria' : 'semanal',
              vezAtual: 1,
              xpGanho: false,
              pomodorosFeitos: 0,
            };
            adicionarTask(newTask);
            metaToSave.tasksVinculadas = [newTask.id];
          } else if (m.sugestaoVinculo.tipo === 'kpi') {
            const newKpi: KPI = {
              id: uuidv4(),
              titulo: m.sugestaoVinculo.titulo,
              valorAtual: 0,
              valorMeta: m.metaProgresso,
              unidade: m.sugestaoVinculo.descricao || 'un',
              tipoCalculo: 'manual',
              frequencia: m.periodo,
              dataInicio: getDataStringBrasil(),
              historico: []
            };
            adicionarKPI(newKpi);
            metaToSave.kpiVinculado = newKpi.id;
          }
          delete metaToSave.sugestaoVinculo;
        }

        adicionarMeta(metaToSave);
      });
    } catch (error) {
      console.error("Failed to generate metas", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent-blue/10 rounded-xl">
            {showArchived ? (
              <History size={28} className="text-accent-blue" strokeWidth={1.5} />
            ) : (
              <Target size={28} className="text-accent-blue" strokeWidth={1.5} />
            )}
          </div>
          <h1 className="text-4xl font-serif font-bold tracking-tight text-text-main">
            {showArchived ? 'Histórico de Metas' : 'Minhas Metas'}
          </h1>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowArchived(!showArchived)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            {showArchived ? (
              <>
                <Target size={20} className="text-accent-blue" strokeWidth={1.5} />
                Ver Ativas
              </>
            ) : (
              <>
                <Archive size={20} className="text-accent-blue" strokeWidth={1.5} />
                Ver Arquivadas
              </>
            )}
          </Button>
          
          {!showArchived && (
            <>
              <Button 
                onClick={handleGenerateAI}
                disabled={isGenerating || isLocked}
                variant="secondary"
                className={`flex items-center gap-2 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isLocked ? "Crie pelo menos 1 Task e 1 KPI primeiro" : ""}
              >
                {isGenerating ? (
                  <div className="w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Sparkles size={20} className="text-accent-purple" strokeWidth={1.5} />
                )}
                Gerar com IA
              </Button>
              <Button 
                onClick={() => setIsFormOpen(true)}
                disabled={isLocked}
                variant="primary"
                className={`flex items-center gap-2 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isLocked ? "Crie pelo menos 1 Task e 1 KPI primeiro" : ""}
              >
                <Plus size={20} strokeWidth={1.5} />
                Nova Meta
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Plano Trimestral */}
      {!showArchived && <PlanoTrimestralWidget />}

      {showArchived ? (
        <div className="space-y-8">
          {archivedMetas.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-bg-sec rounded-full flex items-center justify-center mb-6 border border-border-subtle">
                <Archive size={40} className="text-text-sec" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-serif font-medium mb-2 text-text-main">Nenhuma meta arquivada</h3>
              <p className="text-text-sec max-w-md">As metas concluídas ou expiradas aparecerão aqui.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Concluídas com Sucesso */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-success/30 pb-2">
                  <h2 className="text-xl font-bold text-success flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success"></div>
                    Concluídas
                  </h2>
                  <span className="text-sm text-text-sec font-medium">{archivedSuccess.length}</span>
                </div>
                <div className="space-y-4">
                  {archivedSuccess.map(meta => (
                    <MetaCard 
                      key={meta.id} 
                      meta={meta} 
                      onUpdate={handleUpdateMeta} 
                      onDelete={handleDeleteMeta}
                      // No editing for archived metas
                    />
                  ))}
                  {archivedSuccess.length === 0 && (
                    <div className="text-center py-8 text-text-sec text-sm border border-dashed border-border-subtle rounded-xl">
                      Nenhuma meta concluída no histórico
                    </div>
                  )}
                </div>
              </div>

              {/* Não Concluídas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-red-500/30 pb-2">
                  <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    Não Concluídas
                  </h2>
                  <span className="text-sm text-text-sec font-medium">{archivedFailure.length}</span>
                </div>
                <div className="space-y-4">
                  {archivedFailure.map(meta => (
                    <MetaCard 
                      key={meta.id} 
                      meta={meta} 
                      onUpdate={handleUpdateMeta} 
                      onDelete={handleDeleteMeta}
                      // No editing for archived metas
                    />
                  ))}
                  {archivedFailure.length === 0 && (
                    <div className="text-center py-8 text-text-sec text-sm border border-dashed border-border-subtle rounded-xl">
                      Nenhuma meta falhada no histórico
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : isLocked ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center border-accent-blue/30">
          <div className="w-20 h-20 bg-accent-blue/10 rounded-full flex items-center justify-center mb-6 border border-accent-blue/30">
            <AlertTriangle size={40} className="text-accent-blue" />
          </div>
          <h3 className="text-xl font-medium mb-2">Gere suas KPIs e Tasks primeiro</h3>
          <p className="text-text-sec mb-6 max-w-md">
            As metas devem ficar travadas até o usuário ter KPIs e Tasks geradas.
          </p>
          <div className="flex flex-col items-start gap-2 mb-8 text-text-sec">
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${kpis.length > 0 ? 'bg-success/20 border-success text-success' : 'border-border-subtle bg-bg-sec'}`}>
                {kpis.length > 0 && <span className="text-xs">✓</span>}
              </div>
              <span>Pelo menos 1 KPI criada ({kpis.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${tasks.length > 0 ? 'bg-success/20 border-success text-success' : 'border-border-subtle bg-bg-sec'}`}>
                {tasks.length > 0 && <span className="text-xs">✓</span>}
              </div>
              <span>Pelo menos 1 Task criada ({tasks.length})</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/kpis')} className="btn-secondary flex items-center gap-2">
              <Plus size={18} /> Criar KPI
            </button>
            <button onClick={() => navigate('/tasks')} className="btn-secondary flex items-center gap-2">
              <Plus size={18} /> Criar Task
            </button>
          </div>
        </div>
      ) : (
        <>
          {metas.length === 0 && !isGenerating && (
            <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-6">
              <Sparkles size={18} />
              Pronto! Você tem {kpis.length} KPIs e {tasks.length} Tasks.
            </div>
          )}

          {isGenerating && metas.length === 0 && (
            <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 border-4 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin mb-4"></div>
              <h3 className="text-xl font-medium mb-2">A IA está analisando seu perfil...</h3>
              <p className="text-text-sec">Gerando 9 metas personalizadas (Semanais, Mensais e Trimestrais).</p>
            </div>
          )}

          {!isGenerating && activeMetas.length === 0 && (
            <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-bg-sec rounded-full flex items-center justify-center mb-6 border border-border-subtle">
                <Target size={40} className="text-text-sec" />
              </div>
              <h3 className="text-xl font-medium mb-2">Nenhuma meta ativa</h3>
              <p className="text-text-sec max-w-md">Onde você quer chegar? Defina suas metas para começar a acompanhar seu progresso.</p>
            </div>
          )}

          {activeMetas.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Semanais */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-blue-500/30 pb-2">
                  <h2 className="text-xl font-bold text-blue-500 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Semanais
                  </h2>
                  <span className="text-sm text-text-sec font-medium">{semanais.length}</span>
                </div>
                <div className="space-y-4">
                  {semanais.map(meta => (
                    <MetaCard 
                      key={meta.id} 
                      meta={meta} 
                      onUpdate={handleUpdateMeta} 
                      onDelete={handleDeleteMeta}
                      onEdit={handleEditMeta}
                    />
                  ))}
                  {semanais.length === 0 && (
                    <div className="text-center py-8 text-text-sec text-sm border border-dashed border-border-subtle rounded-xl">
                      Nenhuma meta semanal
                    </div>
                  )}
                </div>
              </div>

              {/* Mensais */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-green-500/30 pb-2">
                  <h2 className="text-xl font-bold text-green-500 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    Mensais
                  </h2>
                  <span className="text-sm text-text-sec font-medium">{mensais.length}</span>
                </div>
                <div className="space-y-4">
                  {mensais.map(meta => (
                    <MetaCard 
                      key={meta.id} 
                      meta={meta} 
                      onUpdate={handleUpdateMeta} 
                      onDelete={handleDeleteMeta}
                      onEdit={handleEditMeta}
                    />
                  ))}
                  {mensais.length === 0 && (
                    <div className="text-center py-8 text-text-sec text-sm border border-dashed border-border-subtle rounded-xl">
                      Nenhuma meta mensal
                    </div>
                  )}
                </div>
              </div>

              {/* Trimestrais */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
                  <h2 className="text-xl font-bold text-purple-500 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    Trimestrais
                  </h2>
                  <span className="text-sm text-text-sec font-medium">{trimestrais.length}</span>
                </div>
                <div className="space-y-4">
                  {trimestrais.map(meta => (
                    <MetaCard 
                      key={meta.id} 
                      meta={meta} 
                      onUpdate={handleUpdateMeta} 
                      onDelete={handleDeleteMeta}
                      onEdit={handleEditMeta}
                    />
                  ))}
                  {trimestrais.length === 0 && (
                    <div className="text-center py-8 text-text-sec text-sm border border-dashed border-border-subtle rounded-xl">
                      Nenhuma meta trimestral
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {isFormOpen && (
        <MetaForm 
          isOpen={isFormOpen} 
          onClose={handleCloseForm} 
          onSave={handleSaveMeta} 
          metaToEdit={metaToEdit}
        />
      )}

      <ConfirmModal
        isOpen={!!metaToDelete}
        title="Excluir Meta"
        message="Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => {
          if (metaToDelete) {
            removerMeta(metaToDelete);
            setMetaToDelete(null);
          }
        }}
        onCancel={() => setMetaToDelete(null)}
      />
    </div>
  );
}

