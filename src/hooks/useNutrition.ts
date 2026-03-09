import { useState, useEffect } from 'react';
import { NutritionProfile, NutritionPlan, MealItem } from '../types';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function useNutrition() {
  const [profile, setProfile] = useState<NutritionProfile | null>(null);
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const savedProfile = getStorageItem<NutritionProfile>('nutrition_profile', null);
    const savedPlan = getStorageItem<NutritionPlan>('nutrition_plan', null);
    
    if (savedProfile) setProfile(savedProfile);
    if (savedPlan) setPlan(savedPlan);
    
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && profile) {
      setStorageItem('nutrition_profile', profile);
    }
  }, [profile, loading]);

  useEffect(() => {
    if (!loading && plan) {
      setStorageItem('nutrition_plan', plan);
    }
  }, [plan, loading]);

  const calculateMetrics = (p: NutritionProfile) => {
    // Harris-Benedict Equation
    let tmb = 0;
    if (p.genero === 'masculino') {
      tmb = 88.36 + (13.4 * p.peso) + (4.8 * p.altura) - (5.7 * p.idade);
    } else {
      tmb = 447.6 + (9.2 * p.peso) + (3.1 * p.altura) - (4.3 * p.idade);
    }

    const activityFactors = {
      'sedentario': 1.2,
      'leve': 1.375,
      'moderado': 1.55,
      'ativo': 1.725,
      'muito_ativo': 1.9
    };

    const get = tmb * activityFactors[p.nivelAtividade];

    let caloriasMeta = get;
    if (p.objetivo === 'perder_peso') caloriasMeta -= 500;
    if (p.objetivo === 'ganhar_musculo') caloriasMeta += 300;

    if (p.metaCaloricaPersonalizada && p.metaCaloricaPersonalizada > 0) {
      caloriasMeta = p.metaCaloricaPersonalizada;
    }

    const macrosMeta = {
      proteina: Math.round((caloriasMeta * 0.30) / 4),
      gorduras: Math.round((caloriasMeta * 0.25) / 9),
      carboidratos: Math.round((caloriasMeta * 0.45) / 4)
    };

    return { tmb, get, caloriasMeta, macrosMeta };
  };

  const generatePlan = async (currentProfile: NutritionProfile) => {
    setGenerating(true);
    try {
      const metrics = calculateMetrics(currentProfile);
      
      const prompt = `
        Crie um plano alimentar diário personalizado baseado nos seguintes dados:
        - Perfil: ${currentProfile.genero}, ${currentProfile.idade} anos, ${currentProfile.peso}kg, ${currentProfile.altura}cm
        - Objetivo: ${currentProfile.objetivo}
        - Calorias Meta: ${Math.round(metrics.caloriasMeta)} kcal
        - Refeições: ${currentProfile.refeicoesPorDia} por dia
        - Horários preferidos: ${currentProfile.horariosRefeicoes}
        - Restrições: ${currentProfile.restricoesAlimentares.join(', ') || 'Nenhuma'}
        - Preferências: ${currentProfile.preferencias}
        - Não gosta: ${currentProfile.naoGosta}
        
        O plano deve seguir o princípio Hara Hachi Bu (comer até 80% da saciedade), focando em alimentos nutritivos e volumes adequados.
        
        Retorne APENAS um JSON com a seguinte estrutura:
        {
          "refeicoes": [
            {
              "nome": "Nome da refeição (ex: Café da Manhã)",
              "horario": "Horário sugerido",
              "prato": "Nome do prato principal",
              "ingredientes": ["Lista de ingredientes"],
              "quantidadeGramas": 0,
              "calorias": 0,
              "macros": { "proteina": 0, "carboidratos": 0, "gorduras": 0 }
            }
          ],
          "dicasHaraHachiBu": ["Dica 1", "Dica 2", "Dica 3"]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refeicoes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nome: { type: Type.STRING },
                    horario: { type: Type.STRING },
                    prato: { type: Type.STRING },
                    ingredientes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    quantidadeGramas: { type: Type.NUMBER },
                    calorias: { type: Type.NUMBER },
                    macros: {
                      type: Type.OBJECT,
                      properties: {
                        proteina: { type: Type.NUMBER },
                        carboidratos: { type: Type.NUMBER },
                        gorduras: { type: Type.NUMBER }
                      }
                    }
                  }
                }
              },
              dicasHaraHachiBu: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });

      const result = JSON.parse(response.text);
      
      const newPlan: NutritionPlan = {
        ...metrics,
        refeicoes: result.refeicoes,
        dicasHaraHachiBu: result.dicasHaraHachiBu
      };

      setPlan(newPlan);
      setProfile(currentProfile);
      
    } catch (error) {
      console.error("Erro ao gerar plano:", error);
      alert("Erro ao gerar plano alimentar. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const updateProfile = (newProfile: NutritionProfile) => {
    setProfile(newProfile);
  };

  return {
    profile,
    plan,
    loading,
    generating,
    updateProfile,
    generatePlan,
    calculateMetrics
  };
}
