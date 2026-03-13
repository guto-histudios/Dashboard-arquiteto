import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { HealthData } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { generateDarebeePlan } from '../services/geminiService';
import { Dumbbell, Activity, Calendar, Clock, Heart, ArrowRight, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export function Darebee() {
  const { healthData, setHealthData, workoutPlan, setWorkoutPlan } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const [formData, setFormData] = useState<HealthData>(healthData || {
    peso: 70,
    altura: 170,
    idade: 30,
    genero: 'Masculino',
    nivelAtividade: 'sedentario',
    objetivo: 'condicionamento',
    equipamentos: 'nenhum',
    diasTreino: 3,
    tempoPorDia: 30,
    condicoesMedicas: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'peso' || name === 'altura' || name === 'idade' || name === 'diasTreino' || name === 'tempoPorDia' 
        ? Number(value) 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      setHealthData(formData);
      const plan = await generateDarebeePlan(formData);
      setWorkoutPlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao gerar plano.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setShowConfirmReset(true);
  };

  if (workoutPlan) {
    return (
      <div className="space-y-8 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-blue/10 rounded-xl">
              <Dumbbell size={28} className="text-accent-blue" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Seu Plano Darebee</h1>
              <p className="text-text-sec font-medium">Treino personalizado gerado por IA</p>
            </div>
          </div>
          <button 
            onClick={handleReset}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Gerar Novo Plano
          </button>
        </div>

        <div className="glass-card p-6 border-l-4 border-accent-blue">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Activity className="text-accent-blue" size={20} />
            Recomendações Gerais
          </h3>
          <p className="text-text-sec leading-relaxed">{workoutPlan.recomendacoesGerais}</p>
        </div>

        <div className="space-y-6">
          {workoutPlan.dias.map((dia) => (
            <div key={dia.dia} className="glass-card overflow-hidden">
              <div className="bg-bg-sec/50 p-4 border-b border-border-subtle flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Calendar className="text-accent-purple" size={20} />
                  Dia {dia.dia}
                </h3>
                <span className={clsx(
                  "px-3 py-1 rounded-full text-sm font-bold",
                  dia.foco.toLowerCase().includes('descanso') 
                    ? "bg-bg-main text-text-sec border border-border-subtle" 
                    : "bg-accent-purple/10 text-accent-purple border border-accent-purple/20"
                )}>
                  {dia.foco}
                </span>
              </div>
              
              <div className="p-4">
                {dia.exercicios && dia.exercicios.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dia.exercicios.map((ex, idx) => (
                      <div key={idx} className="bg-bg-main border border-border-subtle rounded-xl p-4 hover:border-accent-blue/50 transition-colors">
                        <h4 className="font-bold text-white mb-3 text-lg">{ex.nome}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center pb-2 border-b border-border-subtle/50">
                            <span className="text-text-sec">Séries</span>
                            <span className="font-bold text-white">{ex.series}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border-subtle/50">
                            <span className="text-text-sec">Repetições</span>
                            <span className="font-bold text-white">{ex.repeticoes}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border-subtle/50">
                            <span className="text-text-sec">Descanso</span>
                            <span className="font-bold text-white">{ex.descanso}</span>
                          </div>
                          <div className="pt-2">
                            <span className="text-text-sec block mb-1">Instruções:</span>
                            <span className="text-white/90 leading-snug block">{ex.instrucoes}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-sec flex flex-col items-center justify-center">
                    <CheckCircle size={32} className="mb-2 text-success/50" />
                    <p>Dia de descanso ativo ou recuperação.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex p-4 bg-accent-blue/10 rounded-2xl mb-2">
          <Dumbbell size={40} className="text-accent-blue" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Gerador de Treino Darebee</h1>
        <p className="text-text-sec text-lg max-w-xl mx-auto">
          Preencha seus dados físicos e disponibilidade para receber um plano de treinamento personalizado baseado na metodologia Darebee.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-8">
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-xl font-bold border-b border-border-subtle pb-2 flex items-center gap-2">
            <Heart className="text-error" size={20} />
            Dados Físicos
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-sec mb-2">Peso (kg)</label>
              <input
                type="number"
                name="peso"
                required
                min="30"
                max="300"
                value={formData.peso}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-sec mb-2">Altura (cm)</label>
              <input
                type="number"
                name="altura"
                required
                min="100"
                max="250"
                value={formData.altura}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-sec mb-2">Idade</label>
              <input
                type="number"
                name="idade"
                required
                min="10"
                max="120"
                value={formData.idade}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-sec mb-2">Gênero</label>
              <select
                name="genero"
                value={formData.genero}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold border-b border-border-subtle pb-2 flex items-center gap-2">
            <Activity className="text-accent-purple" size={20} />
            Perfil de Atividade
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-sec mb-2">Nível de Atividade Atual</label>
              <select
                name="nivelAtividade"
                value={formData.nivelAtividade}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="sedentario">Sedentário</option>
                <option value="pouco_ativo">Pouco Ativo</option>
                <option value="ativo">Ativo</option>
                <option value="muito_ativo">Muito Ativo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-sec mb-2">Objetivo Principal</label>
              <select
                name="objetivo"
                value={formData.objetivo}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="perder_peso">Perder Peso</option>
                <option value="ganhar_musculo">Ganhar Massa Muscular</option>
                <option value="manter_peso">Manter Peso</option>
                <option value="condicionamento">Condicionamento Físico</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-sec mb-2">Equipamentos Disponíveis</label>
              <select
                name="equipamentos"
                value={formData.equipamentos}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="nenhum">Nenhum (Peso Corporal)</option>
                <option value="halteres">Halteres</option>
                <option value="elasticos">Elásticos / Faixas</option>
                <option value="academia_completa">Academia Completa</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold border-b border-border-subtle pb-2 flex items-center gap-2">
            <Clock className="text-warning" size={20} />
            Disponibilidade
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-sec mb-2">Dias por Semana (1-7)</label>
              <input
                type="number"
                name="diasTreino"
                required
                min="1"
                max="7"
                value={formData.diasTreino}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-sec mb-2">Tempo por Dia (minutos)</label>
              <input
                type="number"
                name="tempoPorDia"
                required
                min="10"
                max="180"
                value={formData.tempoPorDia}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-sec mb-2">Condições Médicas (Opcional)</label>
              <textarea
                name="condicoesMedicas"
                rows={3}
                placeholder="Ex: Dor no joelho, asma, etc."
                value={formData.condicoesMedicas}
                onChange={handleInputChange}
                className="input-field resize-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3"
          >
            {isGenerating ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Gerando Plano Personalizado...
              </>
            ) : (
              <>
                Gerar Plano Darebee
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
