import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useHabitos } from '../hooks/useHabitos';
import { useMetas } from '../hooks/useMetas';
import { useKPIs } from '../hooks/useKPIs';
import { useConfiguracoes } from '../hooks/useConfiguracoes';
import { useGamification, BADGES_INFO } from '../hooks/useGamification';
import { useHaraHachiBu } from '../hooks/useHaraHachiBu';
import { useWeeklyReports } from '../hooks/useWeeklyReports';
import { Task, Habito, Meta, KPI, Configuracao, HorarioFixo, UserProfile, TaskStatus, HealthData, WorkoutPlan, GamificationState, BadgeInfo, DailyMeals, Recompensa, WeeklyReport } from '../types';
import { getDataStringBrasil } from '../utils/dataUtils';
import { THEMES } from '../utils/themeUtils';

import { v4 as uuidv4 } from 'uuid';

interface AppContextData {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  adicionarTask: (task: Task) => void;
  atualizarTask: (id: string, updates: Partial<Task>) => void;
  removerTask: (id: string) => void;
  mudarStatus: (id: string, status: TaskStatus) => void;
  adiarTask: (id: string, novaData: string) => void;

  habitos: Habito[];
  setHabitos: (habitos: Habito[]) => void;
  adicionarHabito: (habito: Habito) => void;
  atualizarHabito: (id: string, updates: Partial<Habito>) => void;
  removerHabito: (id: string) => void;
  toggleConclusaoHabito: (id: string, data: string) => void;
  calcularProgressoHabitos: (data: string) => number;

  metas: Meta[];
  setMetas: (metas: Meta[]) => void;
  adicionarMeta: (meta: Meta) => void;
  atualizarMeta: (id: string, updates: Partial<Meta>) => void;
  removerMeta: (id: string) => void;

  kpis: KPI[];
  setKPIs: (kpis: KPI[]) => void;
  adicionarKPI: (kpi: KPI) => void;
  atualizarKPI: (id: string, valor: number) => void;
  editarKPI: (kpi: KPI) => void;
  removerKPI: (id: string) => void;

  config: Configuracao;
  atualizarConfig: (updates: Partial<Configuracao>) => void;
  horariosFixos: HorarioFixo[];
  adicionarHorarioFixo: (horario: HorarioFixo) => void;
  atualizarHorarioFixo: (id: string, updates: Partial<HorarioFixo>) => void;
  removerHorarioFixo: (id: string) => void;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  
  healthData: HealthData | null;
  setHealthData: (data: HealthData | null) => void;
  workoutPlan: WorkoutPlan | null;
  setWorkoutPlan: (plan: WorkoutPlan | null) => void;

  dailyMeals: DailyMeals | null;
  saveDailyMeals: (meals: DailyMeals) => void;
  chooseMealOption: (optionId: string) => void;

  // Gamification
  gamification: GamificationState;
  addXP: (amount: number) => void;
  unlockBadge: (badgeId: string) => void;
  getLevelInfo: (xp: number) => { nivel: number, xpAtualNoNivel: number, xpParaProximoNivel: number, progressoPercentual: number };
  badgesInfo: Record<string, BadgeInfo>;
  addCoins: (amount: number, description: string) => void;
  spendCoins: (amount: number, description: string) => boolean;
  buyReward: (reward: Recompensa) => boolean;
  useReward: (compraId: string) => void;
  recentBadges: string[];
  clearRecentBadge: (badgeId: string) => void;

  // Weekly Reports
  weeklyReports: WeeklyReport[];
  generateWeeklyReport: () => WeeklyReport;
  deleteWeeklyReport: (id: string) => void;

  carregando: boolean;
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  isFocusMode: boolean;
  setIsFocusMode: (isFocus: boolean) => void;
}

const AppContext = createContext<AppContextData>({} as AppContextData);

export function AppProvider({ children }: { children: ReactNode }) {
  const tasksHook = useTasks();
  const habitosHook = useHabitos();
  const metasHook = useMetas();
  const kpisHook = useKPIs();
  const configHook = useConfiguracoes();
  const gamificationHook = useGamification();
  const haraHachiBuHook = useHaraHachiBu();
  const weeklyReportsHook = useWeeklyReports();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const carregando = tasksHook.carregando || habitosHook.carregando || metasHook.carregando || kpisHook.carregando || configHook.carregando || gamificationHook.carregando || haraHachiBuHook.carregando || weeklyReportsHook.carregando;

  // Auto-create tasks for fixed schedules
  useEffect(() => {
    if (carregando) return;
    const hoje = getDataStringBrasil();
    
    configHook.horariosFixos.forEach(hf => {
      const taskExists = tasksHook.tasks.some(t => 
        t.data === hoje && t.horarioFixoId === hf.id
      );
      
      if (!taskExists) {
        let duracao = 60;
        if (hf.horaFim) {
           const [h1, m1] = hf.horaInicio.split(':').map(Number);
           const [h2, m2] = hf.horaFim.split(':').map(Number);
           let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
           if (diff < 0) diff += 24 * 60;
           duracao = diff;
        }

        tasksHook.adicionarTask({
          id: uuidv4(),
          titulo: hf.descricao,
          status: 'nao_iniciada',
          data: hoje,
          categoria: 'pessoal',
          prioridade: 'media',
          duracao: duracao,
          tipoRepeticao: 'nenhuma',
          horarioInicio: hf.horaInicio,
          horarioFim: hf.horaFim,
          horarioFixo: true,
          horarioFixoId: hf.id,
          vezAtual: 1,
          xpGanho: false,
          pomodorosFeitos: 0
        });
      }
    });
  }, [configHook.horariosFixos, tasksHook.tasks, carregando]);

  // Apply theme
  useEffect(() => {
    if (configHook.carregando) return;
    const tema = configHook.config.tema || 'roxo';
    const colors = THEMES[tema] || THEMES['roxo'];
    document.documentElement.style.setProperty('--theme-primary', colors.primary);
    document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
  }, [configHook.config.tema, configHook.carregando]);

  const mudarStatus = (id: string, status: TaskStatus) => {
    const taskAnterior = tasksHook.tasks.find(t => t.id === id);
    
    tasksHook.mudarStatus(id, status, (task) => {
      // Logic when task is completed
      if (status === 'concluida' && taskAnterior?.status !== 'concluida') {
        // Add XP
        gamificationHook.addXP(10);
        // Add Coins
        gamificationHook.addCoins(5, `Task concluída: ${task.titulo}`);
        
        // Badge: Iniciante
        gamificationHook.unlockBadge('iniciante');
        
        // Badge: Maratonista (10 tasks in a day)
        const hoje = getDataStringBrasil();
        const concluidaHoje = tasksHook.tasks.filter(t => t.data === hoje && t.status === 'concluida').length + 1; // +1 for current
        if (concluidaHoje >= 10) {
          gamificationHook.unlockBadge('maratonista');
        }

        // Badges: Trabalhador, Dedicado, Mestre
        const totalConcluidas = tasksHook.tasks.filter(t => t.status === 'concluida').length + 1;
        if (totalConcluidas >= 50) gamificationHook.unlockBadge('trabalhador');
        if (totalConcluidas >= 100) gamificationHook.unlockBadge('dedicado');
        if (totalConcluidas >= 500) gamificationHook.unlockBadge('mestre_tasks');

        // Badges: Madrugador, Noite Alta
        const horaAtual = new Date().getHours();
        if (horaAtual < 7) gamificationHook.unlockBadge('madrugador');
        if (horaAtual >= 23) gamificationHook.unlockBadge('noite_alta');
      }

      if (task.kpiVinculado) {
        const kpi = kpisHook.kpis.find(k => k.id === task.kpiVinculado);
        if (kpi) {
          kpisHook.atualizarKPI(kpi.id, kpi.valorAtual + 1);
        }
      }
    });
  };

  const removerTask = (id: string) => {
    const metaVinculada = metasHook.metas.find(m => m.tasksVinculadas?.includes(id));
    if (metaVinculada) {
      alert(`Atenção: Esta task está vinculada à meta "${metaVinculada.titulo}". Por favor, vincule outra task à meta.`);
    }
    tasksHook.removerTask(id);
  };

  const removerKPI = (id: string) => {
    const metaVinculada = metasHook.metas.find(m => m.kpiVinculado === id);
    if (metaVinculada) {
      alert(`Atenção: Este KPI está vinculado à meta "${metaVinculada.titulo}". Por favor, vincule outro KPI à meta.`);
    }
    kpisHook.removerKPI(id);
  };

  const toggleConclusaoHabito = (id: string, data: string) => {
    const habito = habitosHook.habitos.find(h => h.id === id);
    const conclusaoAtual = habito?.conclusoes.find(c => c.data === data)?.concluido;
    
    habitosHook.toggleConclusao(id, data, (habito) => {
        // Add Coins
        gamificationHook.addCoins(2, `Hábito cumprido: ${habito.nome}`);
    });
    
    // Add XP if completed
    if (!conclusaoAtual) {
      gamificationHook.addXP(5);
    }
  };

  // Check habit badge
  useEffect(() => {
    if (carregando) return;
    const hoje = getDataStringBrasil();
    const [ano, mes, dia] = hoje.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    const diaSemana = dataObj.getDay();
    const habitosHoje = habitosHook.habitos.filter(h => h.diasSemana.includes(diaSemana));
    
    if (habitosHoje.length > 0) {
      const todosConcluidos = habitosHoje.every(h => h.conclusoes.some(c => c.data === hoje && c.concluido));
      if (todosConcluidos) {
        gamificationHook.unlockBadge('habitado');
      }
    }
  }, [habitosHook.habitos, carregando]);

  // Check habit streaks for badges
  useEffect(() => {
    if (carregando) return;
    
    habitosHook.habitos.forEach(h => {
      if (h.streak >= 7) {
        gamificationHook.unlockBadge('consistente');
      }
      if (h.streak >= 30) {
        gamificationHook.unlockBadge('disciplinado');
      }
      if (h.streak >= 100) {
        gamificationHook.unlockBadge('inabalavel');
      }
      if (h.streak >= 365) {
        gamificationHook.unlockBadge('lendario_habitos');
      }

      // Zen: manteve streak de hábitos no final de semana
      const hoje = getDataStringBrasil();
      const [ano, mes, dia] = hoje.split('-').map(Number);
      const dataObj = new Date(ano, mes - 1, dia);
      const diaSemana = dataObj.getDay();
      if ((diaSemana === 0 || diaSemana === 6) && h.streak > 0) {
        const completedToday = h.conclusoes.some(c => c.data === hoje && c.concluido);
        if (completedToday) {
          gamificationHook.unlockBadge('zen');
        }
      }
    });
  }, [habitosHook.habitos, carregando]);

  // Check streak badges (Global)
  useEffect(() => {
    if (carregando) return;
    if (gamificationHook.gamification.streakDias >= 7) {
      gamificationHook.unlockBadge('7_dias');
    }
    if (gamificationHook.gamification.streakDias >= 30) {
      gamificationHook.unlockBadge('30_dias');
    }
    if (gamificationHook.gamification.streakDias >= 100) {
      gamificationHook.unlockBadge('100_dias');
    }
    if (gamificationHook.gamification.streakDias >= 365) {
      gamificationHook.unlockBadge('365_dias');
    }
  }, [gamificationHook.gamification.streakDias, carregando]);

  // Check level badges
  useEffect(() => {
    if (carregando) return;
    const levelInfo = gamificationHook.getLevelInfo(gamificationHook.gamification.totalXP);
    if (levelInfo.nivel >= 5) gamificationHook.unlockBadge('novato');
    if (levelInfo.nivel >= 10) gamificationHook.unlockBadge('veterano');
    if (levelInfo.nivel >= 25) gamificationHook.unlockBadge('especialista');
    if (levelInfo.nivel >= 50) gamificationHook.unlockBadge('mestre_nivel');
    if (levelInfo.nivel >= 100) gamificationHook.unlockBadge('lendario_nivel');
  }, [gamificationHook.gamification.totalXP, carregando]);

  // Automatic KPIs Update
  useEffect(() => {
    if (carregando) return;

    const hoje = getDataStringBrasil();

    kpisHook.kpis.forEach(kpi => {
      if (kpi.tipoCalculo === 'automatico' && kpi.tipoAutomatico) {
        let novoValor = kpi.valorAtual;

        switch (kpi.tipoAutomatico) {
          case 'tasks_concluidas':
            novoValor = tasksHook.tasks.filter(t => t.data === hoje && t.status === 'concluida').length;
            break;
          case 'habitos_concluidos':
            novoValor = habitosHook.habitos.filter(h => h.conclusoes.some(c => c.data === hoje && c.concluido)).length;
            break;
          case 'pomodoro_tempo':
            // Sum pomodoros of tasks from today
            const pomodorosHoje = tasksHook.tasks
              .filter(t => t.data === hoje)
              .reduce((acc, t) => acc + (t.pomodorosFeitos || 0), 0);
            novoValor = pomodorosHoje * configHook.config.duracaoPomodoro;
            break;
          case 'xp_ganho':
             novoValor = gamificationHook.gamification.xpDiario || 0; 
             break;
          case 'streak_atual':
            novoValor = gamificationHook.gamification.streakDias;
            break;
        }

        if (novoValor !== kpi.valorAtual) {
          kpisHook.atualizarKPI(kpi.id, novoValor);
        }
      }
    });
  }, [
    tasksHook.tasks, 
    habitosHook.habitos, 
    gamificationHook.gamification, 
    kpisHook.kpis, 
    configHook.config.duracaoPomodoro, 
    carregando
  ]);

  // Recalculate Metas progress when Tasks or KPIs change
  useEffect(() => {
    if (carregando) return;

    let updated = false;
    const novasMetas = metasHook.metas.map(meta => {
      let progressoTask = 0;
      let progressoKPI = 0;
      const temTask = meta.tasksVinculadas && meta.tasksVinculadas.length > 0;
      const temKPI = !!meta.kpiVinculado;

      if (temTask) {
        const tarefasConcluidas = meta.tasksVinculadas.filter(tid => {
          const task = tasksHook.tasks.find(t => t.id === tid);
          return task && task.status === 'concluida';
        });
        progressoTask = (tarefasConcluidas.length / meta.tasksVinculadas.length) * 100;
      }

      if (temKPI) {
        const kpi = kpisHook.kpis.find(k => k.id === meta.kpiVinculado);
        if (kpi && kpi.valorMeta > 0) {
          progressoKPI = Math.min((kpi.valorAtual / kpi.valorMeta) * 100, 100);
        } else if (kpi && meta.metaProgresso) {
          progressoKPI = Math.min((kpi.valorAtual / meta.metaProgresso) * 100, 100);
        }
      }

      if (temTask || temKPI) {
        let progressoTotal = 0;
        
        if (temKPI && temTask) {
          // Se tem ambos, média
          if (progressoKPI > 0 && progressoTask > 0) {
            progressoTotal = Math.round((progressoKPI + progressoTask) / 2);
          } else {
            progressoTotal = Math.round(Math.max(progressoKPI, progressoTask));
          }
        } else if (temKPI) {
          // Se só tem KPI
          progressoTotal = Math.round(progressoKPI);
        } else if (temTask) {
          // Se só tem Task
          progressoTotal = Math.round(progressoTask);
        }

        const novoStatus = progressoTotal >= 100 ? 'concluida' : (progressoTotal > 0 ? 'em_andamento' : 'nao_iniciada');
        
        if (progressoTotal !== meta.progresso || novoStatus !== meta.status) {
          updated = true;
          
          // Add XP and Badge if completed
          if (novoStatus === 'concluida' && meta.status !== 'concluida') {
            gamificationHook.addXP(50);
            gamificationHook.unlockBadge('meta_breaker');
            
            const totalMetasConcluidas = metasHook.metas.filter(m => m.status === 'concluida').length + 1;
            if (totalMetasConcluidas >= 5) gamificationHook.unlockBadge('conquistador');
            if (totalMetasConcluidas >= 20) gamificationHook.unlockBadge('realizador');
            if (totalMetasConcluidas >= 50) gamificationHook.unlockBadge('gloria');
          }

          return { ...meta, progresso: progressoTotal, status: novoStatus };
        }
      }
      return meta;
    });

    if (updated) {
      metasHook.setMetas(novasMetas);
    }
  }, [tasksHook.tasks, kpisHook.kpis, carregando]);

  return (
    <AppContext.Provider value={{
      tasks: tasksHook.tasks,
      setTasks: tasksHook.setTasks,
      adicionarTask: tasksHook.adicionarTask,
      atualizarTask: tasksHook.atualizarTask,
      removerTask: removerTask,
      mudarStatus: mudarStatus,
      adiarTask: tasksHook.adiarTask,

      habitos: habitosHook.habitos,
      setHabitos: habitosHook.setHabitos,
      adicionarHabito: habitosHook.adicionarHabito,
      atualizarHabito: habitosHook.atualizarHabito,
      removerHabito: habitosHook.removerHabito,
      toggleConclusaoHabito: toggleConclusaoHabito,
      calcularProgressoHabitos: habitosHook.calcularProgressoHabitos,

      metas: metasHook.metas,
      setMetas: metasHook.setMetas,
      adicionarMeta: metasHook.adicionarMeta,
      atualizarMeta: (id, updates) => {
        metasHook.atualizarMeta(id, updates, (meta) => {
            gamificationHook.addCoins(20, `Meta concluída: ${meta.titulo}`);
            gamificationHook.addXP(50);
            gamificationHook.unlockBadge('meta_breaker');
            
            const totalMetasConcluidas = metasHook.metas.filter(m => m.status === 'concluida').length + 1;
            if (totalMetasConcluidas >= 5) gamificationHook.unlockBadge('conquistador');
            if (totalMetasConcluidas >= 20) gamificationHook.unlockBadge('realizador');
            if (totalMetasConcluidas >= 50) gamificationHook.unlockBadge('gloria');
        });
      },
      removerMeta: metasHook.removerMeta,

      kpis: kpisHook.kpis,
      setKPIs: kpisHook.setKPIs,
      adicionarKPI: kpisHook.adicionarKPI,
      atualizarKPI: kpisHook.atualizarKPI,
      editarKPI: kpisHook.editarKPI,
      removerKPI: removerKPI,

      config: configHook.config,
      atualizarConfig: configHook.atualizarConfig,
      horariosFixos: configHook.horariosFixos,
      adicionarHorarioFixo: configHook.adicionarHorarioFixo,
      atualizarHorarioFixo: configHook.atualizarHorarioFixo,
      removerHorarioFixo: configHook.removerHorarioFixo,
      userProfile: configHook.userProfile,
      setUserProfile: configHook.setUserProfile,
      healthData: configHook.healthData,
      setHealthData: configHook.setHealthData,
      workoutPlan: configHook.workoutPlan,
      setWorkoutPlan: configHook.setWorkoutPlan,

      dailyMeals: haraHachiBuHook.dailyMeals,
      saveDailyMeals: haraHachiBuHook.saveDailyMeals,
      chooseMealOption: haraHachiBuHook.chooseMealOption,

      gamification: gamificationHook.gamification,
      addXP: gamificationHook.addXP,
      unlockBadge: gamificationHook.unlockBadge,
      getLevelInfo: gamificationHook.getLevelInfo,
      badgesInfo: BADGES_INFO,
      addCoins: gamificationHook.addCoins,
      spendCoins: gamificationHook.spendCoins,
      buyReward: gamificationHook.buyReward,
      useReward: gamificationHook.useReward,
      recentBadges: gamificationHook.recentBadges,
      clearRecentBadge: gamificationHook.clearRecentBadge,

      weeklyReports: weeklyReportsHook.reports,
      generateWeeklyReport: () => weeklyReportsHook.generateReport(
        tasksHook.tasks,
        habitosHook.habitos,
        metasHook.metas,
        gamificationHook.gamification,
        gamificationHook.getLevelInfo(gamificationHook.gamification.totalXP).nivel
      ),
      deleteWeeklyReport: weeklyReportsHook.deleteReport,

      carregando,
      activeTaskId,
      setActiveTaskId,
      isFocusMode,
      setIsFocusMode
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

