import { useState, useEffect } from 'react';
import { Configuracao, HorarioFixo, UserProfile, HealthData, WorkoutPlan } from '../types';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';

const DEFAULT_CONFIG: Configuracao = {
  timezone: 'America/Sao_Paulo',
  duracaoPomodoro: 25,
  pomodorosAntesPause: 4,
  duracaoPausaCurta: 5,
  duracaoPausaLonga: 15,
  limiteKanban: 3,
  onboardingCompleted: false,
  tema: 'roxo',
};

export function useConfiguracoes() {
  const [config, setConfig] = useState<Configuracao>(DEFAULT_CONFIG);
  const [horariosFixos, setHorariosFixos] = useState<HorarioFixo[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const savedConfig = getStorageItem<Configuracao>('configuracoes', DEFAULT_CONFIG);
    const savedHorarios = getStorageItem<HorarioFixo[]>('horariosFixos', []);
    const savedProfile = getStorageItem<UserProfile | null>('userProfile', null);
    const savedHealthData = getStorageItem<HealthData | null>('healthData', null);
    const savedWorkoutPlan = getStorageItem<WorkoutPlan | null>('workoutPlan', null);
    
    // Ensure new config properties are present if loading from old storage
    const mergedConfig = { ...DEFAULT_CONFIG, ...savedConfig };
    
    setConfig(mergedConfig);
    setHorariosFixos(savedHorarios);
    setUserProfile(savedProfile);
    setHealthData(savedHealthData);
    setWorkoutPlan(savedWorkoutPlan);
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (!carregando) {
      setStorageItem('configuracoes', config);
      setStorageItem('horariosFixos', horariosFixos);
      setStorageItem('userProfile', userProfile);
      setStorageItem('healthData', healthData);
      setStorageItem('workoutPlan', workoutPlan);
    }
  }, [config, horariosFixos, userProfile, healthData, workoutPlan, carregando]);

  const atualizarConfig = (updates: Partial<Configuracao>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const adicionarHorarioFixo = (horario: HorarioFixo) => {
    setHorariosFixos(prev => [...prev, horario]);
  };

  const atualizarHorarioFixo = (id: string, updates: Partial<HorarioFixo>) => {
    setHorariosFixos(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const removerHorarioFixo = (id: string) => {
    setHorariosFixos(prev => prev.filter(h => h.id !== id));
  };

  return { 
    config, atualizarConfig, 
    horariosFixos, adicionarHorarioFixo, atualizarHorarioFixo, removerHorarioFixo, 
    userProfile, setUserProfile, 
    healthData, setHealthData,
    workoutPlan, setWorkoutPlan,
    carregando 
  };
}
