import React, { useState } from 'react';
import { X, Sparkles, Check, RefreshCw } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { generateHabitos } from '../../services/geminiService';
import { Habito } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface AIHabitGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIHabitGenerator({ isOpen, onClose }: AIHabitGeneratorProps) {
  const { config, habitos, adicionarHabito } = useApp();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const generated = await generateHabitos(config, habitos);
      setSuggestions(generated);
    } catch (err) {
      setError('Erro ao gerar hábitos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (suggestion: any) => {
    if (habitos.length >= 10) {
      alert('Você atingiu o limite máximo de 10 hábitos ativos.');
      return;
    }

    const newHabito: Habito = {
      id: uuidv4(),
      nome: suggestion.nome,
      categoria: suggestion.categoria || 'pessoal',
      diasSemana: suggestion.frequencia === 'diaria' ? [0, 1, 2, 3, 4, 5, 6] : (suggestion.diasSemana || [0, 1, 2, 3, 4, 5, 6]),
      horario: suggestion.horario || '',
      conclusoes: [],
      streak: 0
    };

    adicionarHabito(newHabito);
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const handleReject = (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-main border border-border-subtle rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-border-subtle bg-bg-sec/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-purple/10 rounded-lg">
              <Sparkles size={24} className="text-accent-purple" />
            </div>
            <h2 className="text-2xl font-bold">Gerador de Hábitos com IA</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-sec rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {suggestions.length === 0 && !loading ? (
            <div className="text-center py-12">
              <Sparkles size={48} className="mx-auto text-accent-purple mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Descubra novos hábitos</h3>
              <p className="text-text-sec mb-8 max-w-md mx-auto">
                A IA analisará seus objetivos, rotina e tempo disponível para sugerir os melhores hábitos para você.
              </p>
              <button
                onClick={handleGenerate}
                className="bg-gradient-to-r from-accent-purple to-indigo-600 text-white font-medium px-8 py-3 rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-accent-purple/25 flex items-center gap-2 mx-auto"
              >
                <Sparkles size={20} />
                Gerar Sugestões Personalizadas
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-accent-purple/20 border-t-accent-purple rounded-full animate-spin mb-6"></div>
              <p className="text-lg font-medium animate-pulse text-accent-purple">Analisando seu perfil...</p>
              <p className="text-sm text-text-sec mt-2">Criando hábitos perfeitamente adaptados à sua rotina</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-text-sec">
                  Encontramos {suggestions.length} sugestões baseadas no seu perfil.
                </p>
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 text-sm text-accent-purple hover:text-accent-purple/80 transition-colors"
                >
                  <RefreshCw size={16} />
                  Regenerar Sugestões
                </button>
              </div>

              {error && (
                <div className="p-4 bg-error/10 border border-error/30 text-error rounded-xl mb-6">
                  {error}
                </div>
              )}

              <div className="grid gap-4">
                {suggestions.map((sug) => (
                  <div key={sug.id} className="bg-bg-sec border border-border-subtle rounded-xl p-5 hover:border-accent-purple/30 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">{sug.nome}</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs font-medium px-2 py-1 bg-bg-sec rounded-md text-text-sec">
                            {sug.frequencia === 'diaria' ? 'Diário' : 'Dias específicos'}
                          </span>
                          <span className="text-xs font-medium px-2 py-1 bg-bg-sec rounded-md text-text-sec">
                            {sug.horario}
                          </span>
                          <span className="text-xs font-medium px-2 py-1 bg-bg-sec rounded-md text-text-sec">
                            {sug.duracaoEstimada} min
                          </span>
                          <span className="text-xs font-medium px-2 py-1 bg-accent-purple/10 text-accent-purple rounded-md capitalize">
                            {sug.categoria}
                          </span>
                        </div>
                        <p className="text-sm text-text-sec leading-relaxed">
                          <span className="font-medium text-white/80">Por que ajuda: </span>
                          {sug.beneficio}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => handleAccept(sug)}
                          className="flex items-center justify-center gap-2 bg-success/10 text-success hover:bg-success hover:text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                        >
                          <Check size={16} />
                          Aceitar
                        </button>
                        <button
                          onClick={() => handleReject(sug.id)}
                          className="flex items-center justify-center gap-2 bg-bg-sec text-text-sec hover:bg-error/10 hover:text-error px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                        >
                          <X size={16} />
                          Recusar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {suggestions.length === 0 && !loading && (
                  <div className="text-center py-8 text-text-sec">
                    Você analisou todas as sugestões.
                    <button onClick={handleGenerate} className="block mx-auto mt-4 text-accent-purple hover:underline">
                      Gerar mais hábitos
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
