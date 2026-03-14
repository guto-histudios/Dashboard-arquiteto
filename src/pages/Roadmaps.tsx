import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Target, CheckCircle, Circle } from 'lucide-react';

export default function RoadmapsPage() {
  const { roadmaps, gerarNovoNivelRoadmap, concluirMilestone } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-serif font-semibold text-text-main mb-8">Roadmaps (Skill Tree)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['saude', 'carreira', 'financas', 'desenvolvimento_pessoal', 'relacionamentos'].map(area => {
          const roadmap = roadmaps.find(r => r.area === area);
          return (
            <div key={area} className="bg-bg-card rounded-xl p-6 shadow-md border border-border-subtle">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-text-main capitalize">{area.replace('_', ' ')}</h2>
                <span className="text-sm text-text-sec">Nível {roadmap?.nivelAtual || 0}</span>
              </div>
              
              {roadmap ? (
                <div className="space-y-3">
                  {roadmap.milestones.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-3 bg-bg-sec rounded-lg">
                      <button onClick={() => concluirMilestone(roadmap.id, m.id)}>
                        {m.status === 'concluido' ? 
                          <CheckCircle className="text-emerald-500" size={20} /> : 
                          <Circle className="text-text-sec" size={20} />
                        }
                      </button>
                      <div className={m.status === 'concluido' ? 'line-through text-text-sec' : 'text-text-main'}>
                        <p className="font-medium">{m.titulo}</p>
                        <p className="text-xs text-text-sec">{m.descricao}</p>
                      </div>
                    </div>
                  ))}
                  {roadmap.milestones.every(m => m.status === 'concluido') && (
                    <button 
                      onClick={() => gerarNovoNivelRoadmap(area)}
                      className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    >
                      Gerar Próximo Nível
                    </button>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => gerarNovoNivelRoadmap(area)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Iniciar Roadmap
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
