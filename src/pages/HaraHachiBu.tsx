import React, { useState } from 'react';
import { useNutrition } from '../hooks/useNutrition';
import { NutritionForm } from '../components/nutrition/NutritionForm';
import { NutritionDashboard } from '../components/nutrition/NutritionDashboard';
import { Utensils, Edit2 } from 'lucide-react';

export function HaraHachiBu() {
  const { profile, plan, loading, generating, updateProfile, generatePlan } = useNutrition();
  const [isEditing, setIsEditing] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleProfileSubmit = async (data: any) => {
    updateProfile(data);
    setIsEditing(false);
    await generatePlan(data);
  };

  const handleRegenerate = async () => {
    if (profile) {
      await generatePlan(profile);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent-purple/10 rounded-xl">
            <Utensils size={28} className="text-accent-purple" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Hara Hachi Bu</h1>
            <p className="text-text-sec mt-1">Nutrição Inteligente & Saciedade</p>
          </div>
        </div>

        {profile && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit2 size={18} />
            Editar Perfil
          </button>
        )}
      </div>

      {!profile || isEditing ? (
        <div className="glass-card p-6 md:p-8">
          <h2 className="text-xl font-semibold text-white mb-6">
            {isEditing ? 'Atualizar Perfil Nutricional' : 'Configurar Perfil Nutricional'}
          </h2>
          <NutritionForm
            initialData={profile || undefined}
            onSubmit={handleProfileSubmit}
            loading={generating}
          />
        </div>
      ) : (
        <>
           {generating ? (
             <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
               <div className="w-16 h-16 border-4 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin mb-6"></div>
               <h3 className="text-xl font-medium mb-2 text-white">Criando seu plano nutricional...</h3>
               <p className="text-text-sec max-w-md">A IA está calculando seus macros e selecionando refeições baseadas no princípio Hara Hachi Bu.</p>
             </div>
           ) : plan ? (
             <NutritionDashboard
               plan={plan}
               profile={profile}
               onRegenerate={handleRegenerate}
             />
           ) : (
             <div className="text-center py-10 glass-card">
               <p className="text-text-sec">Nenhum plano encontrado.</p>
               <button onClick={handleRegenerate} className="mt-4 btn-primary">Gerar Plano</button>
             </div>
           )}
        </>
      )}
    </div>
  );
}
