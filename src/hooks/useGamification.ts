import { useState, useEffect } from 'react';
import { GamificationState, BadgeInfo, Recompensa, RecompensaComprada, TransacaoMoeda } from '../types';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';
import { getDataStringBrasil } from '../utils/dataUtils';
import { differenceInDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export const BADGES_INFO: Record<string, BadgeInfo> = {
  // Tasks
  'iniciante': { id: 'iniciante', nome: 'Primeira Task', descricao: 'Primeira task concluída', icone: 'Star', cor: 'text-yellow-500' },
  'maratonista': { id: 'maratonista', nome: 'Maratonista', descricao: '10 tasks concluídas em um dia', icone: 'Activity', cor: 'text-accent-blue' },
  'trabalhador': { id: 'trabalhador', nome: 'Trabalhador', descricao: '50 tasks concluídas', icone: 'Briefcase', cor: 'text-orange-500' },
  'dedicado': { id: 'dedicado', nome: 'Dedicado', descricao: '100 tasks concluídas', icone: 'Award', cor: 'text-accent-purple' },
  'mestre_tasks': { id: 'mestre_tasks', nome: 'Mestre', descricao: '500 tasks concluídas', icone: 'Crown', cor: 'text-yellow-400' },

  // Hábitos
  'habitado': { id: 'habitado', nome: 'Hábitado', descricao: 'Todos os hábitos do dia cumpridos', icone: 'CheckCircle', cor: 'text-emerald-400' },
  'consistente': { id: 'consistente', nome: 'Consistente', descricao: '7 dias seguidos de hábitos', icone: 'Calendar', cor: 'text-blue-400' },
  'disciplinado': { id: 'disciplinado', nome: 'Disciplinado', descricao: '30 dias seguidos de hábitos', icone: 'Shield', cor: 'text-indigo-500' },
  'inabalavel': { id: 'inabalavel', nome: 'Inabalável', descricao: '100 dias seguidos de hábitos', icone: 'Mountain', cor: 'text-slate-600' },
  'lendario_habitos': { id: 'lendario_habitos', nome: 'Lendário', descricao: '365 dias seguidos de hábitos', icone: 'Sun', cor: 'text-yellow-500' },

  // Metas
  'meta_breaker': { id: 'meta_breaker', nome: 'Meta Breaker', descricao: 'Primeira meta concluída', icone: 'Target', cor: 'text-success' },
  'conquistador': { id: 'conquistador', nome: 'Conquistador', descricao: '5 metas concluídas', icone: 'Flag', cor: 'text-blue-500' },
  'realizador': { id: 'realizador', nome: 'Realizador', descricao: '20 metas concluídas', icone: 'TrendingUp', cor: 'text-emerald-500' },
  'gloria': { id: 'gloria', nome: 'Gloria', descricao: '50 metas concluídas', icone: 'Trophy', cor: 'text-yellow-500' },

  // XP/Nível
  'novato': { id: 'novato', nome: 'Novato', descricao: 'Atingiu nível 5', icone: 'ChevronUp', cor: 'text-green-400' },
  'veterano': { id: 'veterano', nome: 'Veterano', descricao: 'Atingiu nível 10', icone: 'ChevronsUp', cor: 'text-blue-500' },
  'especialista': { id: 'especialista', nome: 'Especialista', descricao: 'Atingiu nível 25', icone: 'Star', cor: 'text-purple-500' },
  'mestre_nivel': { id: 'mestre_nivel', nome: 'Mestre', descricao: 'Atingiu nível 50', icone: 'Award', cor: 'text-orange-500' },
  'lendario_nivel': { id: 'lendario_nivel', nome: 'Lendário', descricao: 'Atingiu nível 100', icone: 'Crown', cor: 'text-yellow-500' },

  // Especiais
  'madrugador': { id: 'madrugador', nome: 'Madrugador', descricao: 'Completou task antes das 7h', icone: 'Sunrise', cor: 'text-orange-400' },
  'noite_alta': { id: 'noite_alta', nome: 'Noite Alta', descricao: 'Completou task depois das 23h', icone: 'Moon', cor: 'text-indigo-400' },
  'primo': { id: 'primo', nome: 'Primo', descricao: 'Completou 1 Pomodoro', icone: 'Clock', cor: 'text-red-400' },
  'focado': { id: 'focado', nome: 'Focado', descricao: 'Completou 10 Pomodoros', icone: 'Focus', cor: 'text-red-500' },
  'zen': { id: 'zen', nome: 'Zen', descricao: 'Manteve streak de hábitos no final de semana', icone: 'Wind', cor: 'text-teal-400' },

  // Streak
  '7_dias': { id: '7_dias', nome: '🔥 7 Dias', descricao: '7 dias de sequência', icone: 'Flame', cor: 'text-orange-500' },
  '30_dias': { id: '30_dias', nome: '🔥 30 Dias', descricao: '30 dias de sequência', icone: 'Zap', cor: 'text-accent-purple' },
  '100_dias': { id: '100_dias', nome: '🔥 100 Dias', descricao: '100 dias de sequência', icone: 'Fire', cor: 'text-red-500' },
  '365_dias': { id: '365_dias', nome: '🔥 365 Dias', descricao: '1 ano de sequência', icone: 'Infinity', cor: 'text-yellow-500' },
};

export const REWARDS: Recompensa[] = [
  { id: 'descanso_extra', titulo: 'Descanso Extra', custo: 50, tipo: 'diaria', descricao: '+15 min de pausa', icone: 'Coffee' },
  { id: 'lanche_fds', titulo: 'Lanche do FDS', custo: 100, tipo: 'diaria', descricao: 'Refeição livre', icone: 'Pizza' },
  { id: 'dia_folga', titulo: 'Dia de Folga', custo: 200, tipo: 'diaria', descricao: 'Pular um dia sem culpa', icone: 'Sun' },
  { id: 'movie_night', titulo: 'Movie Night', custo: 150, tipo: 'semanal', descricao: 'Assistir filme sem culpa', icone: 'Film' },
  { id: 'breakfast_bed', titulo: 'Café na Cama', custo: 100, tipo: 'semanal', descricao: 'Café especial', icone: 'Croissant' },
  { id: 'viagem_sonhos', titulo: 'Viagem dos Sonhos', custo: 5000, tipo: 'anual', descricao: 'Meta final do ano', icone: 'Plane' },
  { id: 'upgrade_equip', titulo: 'Upgrade Equipamento', custo: 3000, tipo: 'anual', descricao: 'Para seus hobbies', icone: 'Monitor' },
];

export function useGamification() {
  const [gamification, setGamification] = useState<GamificationState>({
    totalXP: 0,
    xpDiario: 0,
    badges: [],
    streakDias: 0,
    ultimoAcesso: getDataStringBrasil(),
    moedas: 0,
    historicoMoedas: [],
    moedasAcumuladasAno: 0,
    recompensasCompradas: []
  });
  const [carregando, setCarregando] = useState(true);
  const [recentBadges, setRecentBadges] = useState<string[]>([]);

  useEffect(() => {
    const salvos = getStorageItem<GamificationState>('gamification', {
      totalXP: 0,
      xpDiario: 0,
      badges: [],
      streakDias: 0,
      ultimoAcesso: getDataStringBrasil(),
      moedas: 0,
      historicoMoedas: [],
      moedasAcumuladasAno: 0,
      recompensasCompradas: []
    });
    
    // Atualizar streak e resetar XP diário
    const hoje = getDataStringBrasil();
    
    // Migration for existing data
    if (salvos.moedas === undefined) salvos.moedas = 0;
    if (salvos.historicoMoedas === undefined) salvos.historicoMoedas = [];
    if (salvos.moedasAcumuladasAno === undefined) salvos.moedasAcumuladasAno = 0;
    if (salvos.recompensasCompradas === undefined) salvos.recompensasCompradas = [];

    if (salvos.ultimoAcesso !== hoje) {
      const [anoHoje, mesHoje, diaHoje] = hoje.split('-').map(Number);
      const [anoUltimo, mesUltimo, diaUltimo] = salvos.ultimoAcesso.split('-').map(Number);
      const diff = differenceInDays(new Date(anoHoje, mesHoje - 1, diaHoje), new Date(anoUltimo, mesUltimo - 1, diaUltimo));
      if (diff === 1) {
        // Dia consecutivo
        salvos.streakDias += 1;
        // Recompensa por streak
        if (salvos.streakDias % 30 === 0) {
          addCoinsToState(salvos, 50, 'Streak de 30 dias!');
        } else if (salvos.streakDias % 7 === 0) {
          addCoinsToState(salvos, 10, 'Streak de 7 dias!');
        }
      } else if (diff > 1) {
        // Quebrou o streak
        salvos.streakDias = 1;
      }
      salvos.xpDiario = 0; // Reset daily XP
      salvos.ultimoAcesso = hoje;
    }

    setGamification(salvos);
    setCarregando(false);
  }, []);

  // Helper function to modify state object directly (used in initialization)
  const addCoinsToState = (state: GamificationState, amount: number, description: string) => {
    const cost = Number(amount) || 0;
    state.moedas = Number(state.moedas || 0) + cost;
    state.moedasAcumuladasAno = Number(state.moedasAcumuladasAno || 0) + cost;
    state.historicoMoedas.unshift({
      id: uuidv4(),
      data: getDataStringBrasil(),
      quantidade: cost,
      descricao: description,
      tipo: 'ganho'
    });
  };

  useEffect(() => {
    if (!carregando) {
      setStorageItem('gamification', gamification);
    }
  }, [gamification, carregando]);

  const addXP = (amount: number) => {
    setGamification(prev => ({
      ...prev,
      totalXP: prev.totalXP + amount,
      xpDiario: (prev.xpDiario || 0) + amount
    }));
  };

  const addCoins = (amount: number, description: string) => {
    const cost = Number(amount) || 0;
    setGamification(prev => {
      const novaTransacao: TransacaoMoeda = {
        id: uuidv4(),
        data: getDataStringBrasil(),
        quantidade: cost,
        descricao: description,
        tipo: 'ganho'
      };

      return {
        ...prev,
        moedas: Number(prev.moedas || 0) + cost,
        moedasAcumuladasAno: Number(prev.moedasAcumuladasAno || 0) + cost,
        historicoMoedas: [novaTransacao, ...(prev.historicoMoedas || [])]
      };
    });
  };

  const spendCoins = (amount: number, description: string): boolean => {
    const currentCoins = Number(gamification.moedas) || 0;
    const cost = Number(amount) || 0;
    
    if (currentCoins < cost) return false;

    setGamification(prev => {
      const novaTransacao: TransacaoMoeda = {
        id: uuidv4(),
        data: getDataStringBrasil(),
        quantidade: cost,
        descricao: description,
        tipo: 'gasto'
      };

      return {
        ...prev,
        moedas: Number(prev.moedas || 0) - cost,
        historicoMoedas: [novaTransacao, ...(prev.historicoMoedas || [])]
      };
    });
    return true;
  };

  const buyReward = (reward: Recompensa) => {
    const currentCoins = Number(gamification.moedas) || 0;
    const cost = Number(reward.custo) || 0;
    
    console.log(`[useGamification] buyReward chamado para: ${reward.titulo}`);
    console.log(`[useGamification] currentCoins: ${currentCoins}, cost: ${cost}`);

    if (currentCoins >= cost) {
      setGamification(prev => {
        // Double check inside state updater to prevent race conditions
        const prevCoins = Number(prev.moedas || 0);
        console.log(`[useGamification] State updater prev.moedas: ${prevCoins}`);
        
        if (prevCoins < cost) {
          console.log(`[useGamification] Race condition evitada: saldo insuficiente no updater.`);
          return prev;
        }
        
        const novaTransacao: TransacaoMoeda = {
          id: uuidv4(),
          data: getDataStringBrasil(),
          quantidade: cost,
          descricao: `Compra: ${reward.titulo}`,
          tipo: 'gasto'
        };

        console.log(`[useGamification] Deduzindo ${cost} moedas. Novo saldo: ${prevCoins - cost}`);

        return {
          ...prev,
          moedas: prevCoins - cost,
          historicoMoedas: [novaTransacao, ...(prev.historicoMoedas || [])],
          recompensasCompradas: [
            ...(prev.recompensasCompradas || []),
            {
              id: uuidv4(),
              recompensaId: reward.id,
              dataCompra: getDataStringBrasil(),
              usada: false
            }
          ]
        };
      });
      return true;
    }
    console.log(`[useGamification] buyReward falhou: moedas insuficientes.`);
    return false;
  };

  const useReward = (compraId: string) => {
    setGamification(prev => ({
      ...prev,
      recompensasCompradas: (prev.recompensasCompradas || []).map(r => 
        r.id === compraId ? { ...r, usada: true, dataUso: getDataStringBrasil() } : r
      )
    }));
  };

  const unlockBadge = (badgeId: string) => {
    setGamification(prev => {
      if (!prev.badges.includes(badgeId)) {
        setRecentBadges(current => [...current, badgeId]);
        return {
          ...prev,
          badges: [...prev.badges, badgeId]
        };
      }
      return prev;
    });
  };

  const clearRecentBadge = (badgeId: string) => {
    setRecentBadges(current => current.filter(id => id !== badgeId));
  };

  // Helper to calculate level based on total XP
  // Formula: xpParaProximoNivel = nivel * 100
  // Level 1: 0-99 XP
  // Level 2: 100-299 XP (needs 200)
  // Level 3: 300-599 XP (needs 300)
  const getLevelInfo = (xp: number) => {
    let nivel = 1;
    let xpRestante = xp;
    let xpParaProximo = 100;

    while (xpRestante >= xpParaProximo) {
      xpRestante -= xpParaProximo;
      nivel++;
      xpParaProximo = nivel * 100;
    }

    return {
      nivel,
      xpAtualNoNivel: xpRestante,
      xpParaProximoNivel: xpParaProximo,
      progressoPercentual: Math.round((xpRestante / xpParaProximo) * 100)
    };
  };

  return { 
    gamification, 
    addXP, 
    addCoins,
    spendCoins,
    buyReward,
    useReward,
    unlockBadge, 
    getLevelInfo,
    carregando,
    recentBadges,
    clearRecentBadge
  };
}
