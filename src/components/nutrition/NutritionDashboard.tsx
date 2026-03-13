import React, { useState, useEffect } from 'react';
import { NutritionPlan, NutritionProfile, MealItem, Task } from '../../types';
import { Activity, Flame, Utensils, Clock, ChevronRight, Plus, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '../../contexts/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { getDataStringBrasil } from '../../utils/dataUtils';

interface NutritionDashboardProps {
  plan: NutritionPlan;
  profile: NutritionProfile;
  onRegenerate: () => void;
  onSelectOption?: (id: string) => void;
}

function StatCard({ label, value, unit, icon: Icon, color }: any) {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-text-sec uppercase tracking-wider font-medium">{label}</p>
        <p className="text-xl font-bold text-white">{value} <span className="text-sm font-normal text-text-sec">{unit}</span></p>
      </div>
    </div>
  );
}

const MealCard: React.FC<{ meal: MealItem }> = ({ meal }) => {
  const { adicionarTask } = useApp();
  const [taskAdded, setTaskAdded] = useState(false);

  const handleAddTask = () => {
    const newTask: Task = {
      id: uuidv4(),
      titulo: `Preparar ${meal.nome}`,
      descricao: `Prato: ${meal.prato}\nIngredientes: ${meal.ingredientes.join(', ')}`,
      duracao: 30,
      categoria: 'saude',
      prioridade: 'media',
      status: 'nao_iniciada',
      data: getDataStringBrasil(),
      horarioInicio: meal.horario,
      tipoRepeticao: 'nenhuma',
      vezAtual: 1,
      xpGanho: false,
      pomodorosFeitos: 0,
    };
    adicionarTask(newTask);
    setTaskAdded(true);
    setTimeout(() => setTaskAdded(false), 3000);
  };

  return (
    <div className="glass-card p-5 hover:border-accent-blue/30 transition-all duration-300 group relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-bg-sec flex items-center justify-center border border-border-subtle group-hover:border-accent-blue/50 transition-colors">
            <Utensils size={14} className="text-text-sec group-hover:text-accent-blue" />
          </div>
          <div>
            <h4 className="font-semibold text-white">{meal.nome}</h4>
            <div className="flex items-center gap-1.5 text-xs text-text-sec">
              <Clock size={12} />
              <span>{meal.horario}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-accent-blue">{meal.calorias}</span>
          <span className="text-xs text-text-sec ml-1">kcal</span>
        </div>
      </div>

      <div className="mb-4">
        <h5 className="text-sm font-medium text-white mb-1">{meal.prato}</h5>
        <p className="text-xs text-text-sec leading-relaxed">{meal.ingredientes.join(', ')}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-subtle mb-4">
        <div className="text-center">
          <p className="text-[10px] text-text-sec uppercase tracking-wider">Prot</p>
          <p className="text-sm font-medium text-white">{meal.macros.proteina}g</p>
        </div>
        <div className="text-center border-l border-border-subtle">
          <p className="text-[10px] text-text-sec uppercase tracking-wider">Carb</p>
          <p className="text-sm font-medium text-white">{meal.macros.carboidratos}g</p>
        </div>
        <div className="text-center border-l border-border-subtle">
          <p className="text-[10px] text-text-sec uppercase tracking-wider">Gord</p>
          <p className="text-sm font-medium text-white">{meal.macros.gorduras}g</p>
        </div>
      </div>

      <button 
        onClick={handleAddTask}
        disabled={taskAdded}
        className={clsx(
          "w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300",
          taskAdded 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
            : "bg-bg-sec hover:bg-accent-blue/10 text-text-sec hover:text-accent-blue border border-border-subtle hover:border-accent-blue/30"
        )}
      >
        {taskAdded ? (
          <><Check size={16} /> Tarefa Adicionada</>
        ) : (
          <><Plus size={16} /> Criar Tarefa de Preparo</>
        )}
      </button>
    </div>
  );
}

export function NutritionDashboard({ plan, profile, onRegenerate, onSelectOption }: NutritionDashboardProps) {
  const { adicionarTask, dailyMeals, saveDailyMeals, chooseMealOption } = useApp();
  const [taskAdded, setTaskAdded] = useState<string | null>(null);

  // Initialize dailyMeals if not present or different date
  useEffect(() => {
    const hoje = getDataStringBrasil();
    if (plan.opcoes && (!dailyMeals || dailyMeals.data !== hoje)) {
      saveDailyMeals({
        data: hoje,
        opcoesGeradas: plan.opcoes,
        opcaoEscolhidaId: plan.opcaoEscolhidaId
      });
    }
  }, [plan.opcoes, dailyMeals, saveDailyMeals, plan.opcaoEscolhidaId]);

  const handleRandomize = () => {
    if (plan.opcoes && plan.opcoes.length > 0) {
      const randomIndex = Math.floor(Math.random() * plan.opcoes.length);
      const chosenId = plan.opcoes[randomIndex].id;
      if (onSelectOption) onSelectOption(chosenId);
      chooseMealOption(chosenId);
    }
  };

  const handleSelectOption = (id: string) => {
    if (onSelectOption) onSelectOption(id);
    chooseMealOption(id);
  };

  const currentChosenId = dailyMeals?.data === getDataStringBrasil() ? dailyMeals.opcaoEscolhidaId : plan.opcaoEscolhidaId;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Metabolismo Basal" 
          value={Math.round(plan.tmb)} 
          unit="kcal" 
          icon={Activity} 
          color="bg-blue-500/20 ring-1 ring-blue-500/40" 
        />
        <StatCard 
          label="Gasto Total" 
          value={Math.round(plan.get)} 
          unit="kcal" 
          icon={Flame} 
          color="bg-orange-500/20 ring-1 ring-orange-500/40" 
        />
        <StatCard 
          label="Meta Diária" 
          value={Math.round(plan.caloriasMeta)} 
          unit="kcal" 
          icon={Utensils} 
          color="bg-emerald-500/20 ring-1 ring-emerald-500/40" 
        />
        <div className="glass-card p-4 flex flex-col justify-center">
          <div className="flex justify-between text-xs text-text-sec mb-1">
            <span>P: {plan.macrosMeta.proteina}g</span>
            <span>C: {plan.macrosMeta.carboidratos}g</span>
            <span>G: {plan.macrosMeta.gorduras}g</span>
          </div>
          <div className="w-full h-2 bg-bg-sec rounded-full overflow-hidden flex">
            <div style={{ width: '30%' }} className="bg-blue-500 h-full" />
            <div style={{ width: '45%' }} className="bg-emerald-500 h-full" />
            <div style={{ width: '25%' }} className="bg-yellow-500 h-full" />
          </div>
        </div>
      </div>

      {/* Hara Hachi Bu Tips */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🍵</span> Princípios Hara Hachi Bu
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plan.dicasHaraHachiBu.map((dica, index) => (
            <div key={index} className="bg-bg-main/50 p-4 rounded-xl border border-white/5">
              <p className="text-sm text-text-sec leading-relaxed">"{dica}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* Meal Plan Options */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Opções de Cardápio</h3>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleRandomize}
              className="btn-secondary flex items-center gap-2"
            >
              <Activity size={16} /> Randomizar
            </button>
            <button 
              onClick={onRegenerate}
              className="text-sm text-accent-blue hover:text-accent-blue/80 transition-colors flex items-center gap-1"
            >
              Recalcular Plano <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plan.opcoes?.map((opcao) => (
            <div 
              key={opcao.id} 
              className={clsx(
                "glass-card p-6 flex flex-col h-full border-2 transition-all duration-300",
                currentChosenId === opcao.id 
                  ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                  : "border-transparent hover:border-border-subtle"
              )}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">{opcao.nome}</h4>
                  <div className="flex items-center gap-3 text-xs text-text-sec">
                    <span className="flex items-center gap-1"><Flame size={12} className="text-orange-500" /> {opcao.caloriasTotais} kcal</span>
                    <span>P: {opcao.macrosTotais.proteina}g</span>
                    <span>C: {opcao.macrosTotais.carboidratos}g</span>
                    <span>G: {opcao.macrosTotais.gorduras}g</span>
                  </div>
                </div>
                {currentChosenId === opcao.id && (
                  <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-full">
                    <Check size={16} />
                  </div>
                )}
              </div>

              <div className="space-y-4 flex-1">
                {opcao.refeicoes.map((meal, index) => (
                  <div key={index} className="bg-bg-sec/50 p-4 rounded-xl border border-border-subtle">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold text-white text-sm">{meal.nome}</h5>
                      <span className="text-xs font-medium text-accent-blue">{meal.calorias} kcal</span>
                    </div>
                    <p className="text-xs text-white mb-1">{meal.prato}</p>
                    <p className="text-[10px] text-text-sec mb-2">{meal.ingredientes.join(', ')}</p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border-subtle/50">
                      <span className="text-[10px] text-warning italic flex items-center gap-1">
                        <Activity size={10} /> Pare aos 80%
                      </span>
                      <button 
                        onClick={() => {
                          const newTask: Task = {
                            id: uuidv4(),
                            titulo: `Preparar ${meal.nome}`,
                            descricao: `Prato: ${meal.prato}\nIngredientes: ${meal.ingredientes.join(', ')}`,
                            duracao: 30,
                            categoria: 'saude',
                            prioridade: 'media',
                            status: 'nao_iniciada',
                            data: getDataStringBrasil(),
                            horarioInicio: meal.horario,
                            tipoRepeticao: 'nenhuma',
                            vezAtual: 1,
                            xpGanho: false,
                            pomodorosFeitos: 0,
                          };
                          adicionarTask(newTask);
                          setTaskAdded(`${opcao.id}-${index}`);
                          setTimeout(() => setTaskAdded(null), 3000);
                        }}
                        disabled={taskAdded === `${opcao.id}-${index}`}
                        className={clsx(
                          "text-[10px] transition-colors flex items-center gap-1",
                          taskAdded === `${opcao.id}-${index}` 
                            ? "text-emerald-400" 
                            : "text-accent-blue hover:text-white"
                        )}
                      >
                        {taskAdded === `${opcao.id}-${index}` ? (
                          <><Check size={10} /> Adicionada</>
                        ) : (
                          <><Plus size={10} /> Tarefa</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelectOption(opcao.id)}
                className={clsx(
                  "w-full mt-6 py-3 rounded-xl font-medium transition-all duration-300",
                  currentChosenId === opcao.id
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-bg-sec hover:bg-accent-blue/20 text-white border border-border-subtle hover:border-accent-blue/50"
                )}
              >
                {currentChosenId === opcao.id ? 'Opção Selecionada' : 'Selecionar Opção'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
