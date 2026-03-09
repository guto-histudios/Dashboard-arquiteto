import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { MetaCard } from '../components/metas/MetaCard';
import { MetaForm } from '../components/metas/MetaForm';
import { Plus, Target, Sparkles, Archive, History } from 'lucide-react';
import { generateMetas, generateHarderMeta } from '../services/geminiService';
import { Meta } from '../types';

export function Metas() {
  const { metas, adicionarMeta, atualizarMeta, removerMeta, userProfile } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [metaToEdit, setMetaToEdit] = useState<Meta | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeMetas = metas.filter(m => !m.arquivada);
  const archivedMetas = metas.filter(m => m.arquivada);

  const semanais = activeMetas.filter(m => m.periodo === 'semanal');
  const mensais = activeMetas.filter(m => m.periodo === 'mensal');
  const trimestrais = activeMetas.filter(m => m.periodo === 'trimestral');

  const archivedSuccess = archivedMetas.filter(m => m.resultado === 'sucesso');
  const archivedFailure = archivedMetas.filter(m => m.resultado === 'falha');

  // Auto-generate if empty
  useEffect(() => {
    const autoGenerate = async () => {
      if (metas.length === 0 && !isGenerating) {
        setIsGenerating(true);
        try {
          const novasMetas = await generateMetas(userProfile);
          novasMetas.forEach(m => adicionarMeta(m));
        } catch (error) {
          console.error("Failed to auto-generate metas", error);
        } finally {
          setIsGenerating(false);
        }
      }
    };
    
    // Only auto-generate once when the component mounts and metas is empty
    const timer = setTimeout(() => {
      if (metas.length === 0) autoGenerate();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [metas.length, userProfile]);

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
    if (window.confirm('Tem certeza que deseja excluir esta meta?')) {
      removerMeta(id);
    }
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
    setIsGenerating(true);
    try {
      const novasMetas = await generateMetas(userProfile);
      novasMetas.forEach(m => adicionarMeta(m));
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
              <History size={28} className="text-accent-blue" />
            ) : (
              <Target size={28} className="text-accent-blue" />
            )}
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            {showArchived ? 'Histórico de Metas' : 'Minhas Metas'}
          </h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className="btn-secondary flex items-center gap-2"
          >
            {showArchived ? (
              <>
                <Target size={20} className="text-accent-blue" />
                Ver Ativas
              </>
            ) : (
              <>
                <Archive size={20} className="text-accent-blue" />
                Ver Arquivadas
              </>
            )}
          </button>
          
          {!showArchived && (
            <>
              <button 
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="btn-secondary flex items-center gap-2"
              >
                {isGenerating ? (
                  <div className="w-5 h-5 border-2 border-text-sec border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Sparkles size={20} className="text-accent-purple" />
                )}
                Gerar com IA
              </button>
              <button 
                onClick={() => setIsFormOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={20} />
                Nova Meta
              </button>
            </>
          )}
        </div>
      </div>

      {showArchived ? (
        <div className="space-y-8">
          {archivedMetas.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-bg-sec rounded-full flex items-center justify-center mb-6 border border-border-subtle">
                <Archive size={40} className="text-text-sec" />
              </div>
              <h3 className="text-xl font-medium mb-2">Nenhuma meta arquivada</h3>
              <p className="text-text-sec max-w-md">As metas concluídas ou expiradas aparecerão aqui.</p>
            </div>
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
      ) : (
        <>
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
                <div className="flex items-center justify-between border-b border-accent-blue/30 pb-2">
                  <h2 className="text-xl font-bold text-accent-blue flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent-blue"></div>
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
                <div className="flex items-center justify-between border-b border-success/30 pb-2">
                  <h2 className="text-xl font-bold text-success flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success"></div>
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
                <div className="flex items-center justify-between border-b border-accent-purple/30 pb-2">
                  <h2 className="text-xl font-bold text-accent-purple flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent-purple"></div>
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
    </div>
  );
}

