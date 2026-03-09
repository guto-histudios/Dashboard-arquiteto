import { useState, useEffect } from 'react';
import { GamificationState, BadgeInfo, Recompensa, RecompensaComprada, TransacaoMoeda } from '../types';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';
import { getDataStringBrasil } from '../utils/dataUtils';
import { differenceInDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export const BADGES_INFO: Record<string, BadgeInfo> = {
  'iniciante': { id: 'iniciante', nome: 'Iniciante', descricao: 'Primeira task concluída', icone: 'Star', cor: 'text-yellow-500' },
  '7_dias': { id: '7_dias', nome: '7 Dias Seguidos', descricao: 'Manteve 7 dias de sequência', icone: 'Flame', cor: 'text-orange-500' },
  '30_dias': { id: '30_dias', nome: '30 Dias Seguidos', descricao: 'Manteve 30 dias de sequência', icone: 'Zap', cor: 'text-accent-purple' },
  'meta_breaker': { id: 'meta_breaker', nome: 'Meta Breaker', descricao: 'Primeira meta concluída', icone: 'Target', cor: 'text-success' },
  'maratonista': { id: 'maratonista', nome: 'Maratonista', descricao: '10 tasks concluídas em um dia', icone: 'Activity', cor: 'text-accent-blue' },
  'habitado': { id: 'habitado', nome: 'Hábitado', descricao: 'Todos os hábitos do dia cumpridos', icone: 'CheckCircle', cor: 'text-emerald-400' },
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
      const diff = differenceInDays(new Date(hoje), new Date(salvos.ultimoAcesso));
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
    state.moedas += amount;
    state.moedasAcumuladasAno += amount;
    state.historicoMoedas.unshift({
      id: uuidv4(),
      data: getDataStringBrasil(),
      quantidade: amount,
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
    setGamification(prev => {
      const novaTransacao: TransacaoMoeda = {
        id: uuidv4(),
        data: getDataStringBrasil(),
        quantidade: amount,
        descricao: description,
        tipo: 'ganho'
      };

      return {
        ...prev,
        moedas: prev.moedas + amount,
        moedasAcumuladasAno: (prev.moedasAcumuladasAno || 0) + amount,
        historicoMoedas: [novaTransacao, ...prev.historicoMoedas]
      };
    });
  };

  const spendCoins = (amount: number, description: string): boolean => {
    if (gamification.moedas < amount) return false;

    setGamification(prev => {
      const novaTransacao: TransacaoMoeda = {
        id: uuidv4(),
        data: getDataStringBrasil(),
        quantidade: amount,
        descricao: description,
        tipo: 'gasto'
      };

      return {
        ...prev,
        moedas: prev.moedas - amount,
        historicoMoedas: [novaTransacao, ...prev.historicoMoedas]
      };
    });
    return true;
  };

  const buyReward = (reward: Recompensa) => {
    if (spendCoins(reward.custo, `Compra: ${reward.titulo}`)) {
      setGamification(prev => ({
        ...prev,
        recompensasCompradas: [
          ...prev.recompensasCompradas,
          {
            id: uuidv4(),
            recompensaId: reward.id,
            dataCompra: getDataStringBrasil(),
            usada: false
          }
        ]
      }));
      return true;
    }
    return false;
  };

  const useReward = (compraId: string) => {
    setGamification(prev => ({
      ...prev,
      recompensasCompradas: prev.recompensasCompradas.map(r => 
        r.id === compraId ? { ...r, usada: true, dataUso: getDataStringBrasil() } : r
      )
    }));
  };

  const unlockBadge = (badgeId: string) => {
    setGamification(prev => {
      if (!prev.badges.includes(badgeId)) {
        // You could trigger a toast notification here
        return {
          ...prev,
          badges: [...prev.badges, badgeId]
        };
      }
      return prev;
    });
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
    carregando 
  };
}
