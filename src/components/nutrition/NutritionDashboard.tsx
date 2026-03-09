import React from 'react';
import { NutritionPlan, NutritionProfile, MealItem } from '../../types';
import { Activity, Flame, Utensils, Clock, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface NutritionDashboardProps {
  plan: NutritionPlan;
  profile: NutritionProfile;
  onRegenerate: () => void;
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
  return (
    <div className="glass-card p-5 hover:border-accent-blue/30 transition-all duration-300 group">
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

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-subtle">
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
    </div>
  );
}

export function NutritionDashboard({ plan, profile, onRegenerate }: NutritionDashboardProps) {
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

      {/* Meal Plan */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Seu Plano Alimentar</h3>
          <button 
            onClick={onRegenerate}
            className="text-sm text-accent-blue hover:text-accent-blue/80 transition-colors flex items-center gap-1"
          >
            Recalcular Plano <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plan.refeicoes.map((meal, index) => (
            <MealCard key={index} meal={meal} />
          ))}
        </div>
      </div>
    </div>
  );
}
