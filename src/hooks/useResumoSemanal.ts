import { useState, useEffect, useCallback } from 'react';
import { startOfWeek, endOfWeek, format, isWithinInterval } from 'date-fns';
import { useApp } from '../contexts/AppContext';

export interface WeeklySummaryData {
  id: string;
  startDate: string;
  endDate: string;
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  metasCompleted: number;
  metasTotal: number;
  xpEarned: number;
  xpBreakdown: {
    tasks: number;
    habits: number;
    metas: number;
    pomodoros: number;
  };
  levelReached: number;
  bestDay: string;
  totalPomodoros: number;
  reflectionLearned: string;
  reflectionImprove: string;
  reflectionGrateful: string;
  reflectionNextWeek: string;
  isCompleted: boolean;
}

export function useResumoSemanal() {
  const { tasks, habitos, metas, gamification, getLevelInfo } = useApp();
  const [summaries, setSummaries] = useState<WeeklySummaryData[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('weekly_summaries');
    if (saved) {
      setSummaries(JSON.parse(saved));
    }
  }, []);

  const saveSummaries = (newSummaries: WeeklySummaryData[]) => {
    setSummaries(newSummaries);
    localStorage.setItem('weekly_summaries', JSON.stringify(newSummaries));
  };

  const generateSummary = useCallback((date: Date): WeeklySummaryData => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    const id = format(start, 'yyyy-MM-dd');

    const existing = summaries.find(s => s.id === id);
    if (existing) {
      // Return existing but ensure new fields are present for backward compatibility
      return {
        ...existing,
        habitsTotal: existing.habitsTotal ?? habitos.length,
        metasTotal: existing.metasTotal ?? metas.filter(m => m.periodo === 'semanal' && m.dataInicio <= existing.endDate && m.dataFim >= existing.startDate).length,
        xpBreakdown: existing.xpBreakdown ?? { tasks: 0, habits: 0, metas: 0, pomodoros: 0 }
      };
    }

    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    const isDateInWeek = (dateStr: string) => {
      return dateStr >= startStr && dateStr <= endStr;
    };

    // 1. Tasks da semana
    const weekTasks = tasks.filter(t => isDateInWeek(t.data) && t.status !== 'cancelada');
    const tasksCompleted = weekTasks.filter(t => t.status === 'concluida').length;
    const tasksTotal = weekTasks.length;
    const totalPomodoros = weekTasks.reduce((acc, t) => acc + (t.pomodorosFeitos || 0), 0);

    // 2. Hábitos mantidos
    let habitsCompleted = 0;
    const habitsTotal = habitos.length;
    let totalHabitCompletions = 0;
    habitos.forEach(h => {
      const conclusoesNaSemana = h.conclusoes.filter(c => c.concluido && isDateInWeek(c.data));
      totalHabitCompletions += conclusoesNaSemana.length;
      if (conclusoesNaSemana.length >= 3) {
        habitsCompleted++;
      }
    });

    // 3. Metas
    const weekMetas = metas.filter(m => 
      m.periodo === 'semanal' && 
      ((m.dataInicio <= endStr && m.dataFim >= startStr) || isDateInWeek(m.dataFim))
    );
    const metasCompleted = weekMetas.filter(m => m.status === 'concluida').length;
    const metasTotal = weekMetas.length;

    // 4. XP gained
    const xpTasks = tasksCompleted * 10;
    const xpHabits = totalHabitCompletions * 5;
    const xpMetas = metasCompleted * 50;
    const xpPomodoros = totalPomodoros * 3;
    const xpEarned = xpTasks + xpHabits + xpMetas + xpPomodoros;

    const daysCount: Record<string, number> = {};
    weekTasks.filter(t => t.status === 'concluida').forEach(t => {
      daysCount[t.data] = (daysCount[t.data] || 0) + 1;
    });
    let bestDay = '';
    let maxTasks = -1;
    Object.entries(daysCount).forEach(([d, count]) => {
      if (count > maxTasks) {
        maxTasks = count;
        bestDay = d;
      }
    });

    const levelInfo = getLevelInfo(gamification.totalXP);

    return {
      id,
      startDate: startStr,
      endDate: endStr,
      tasksCompleted,
      tasksTotal,
      habitsCompleted,
      habitsTotal,
      metasCompleted,
      metasTotal,
      xpEarned,
      xpBreakdown: {
        tasks: xpTasks,
        habits: xpHabits,
        metas: xpMetas,
        pomodoros: xpPomodoros
      },
      levelReached: levelInfo.nivel,
      bestDay,
      totalPomodoros,
      reflectionLearned: '',
      reflectionImprove: '',
      reflectionGrateful: '',
      reflectionNextWeek: '',
      isCompleted: false
    };
  }, [tasks, habitos, metas, gamification.totalXP, getLevelInfo, summaries]);

  const saveReflection = (id: string, learned: string, improve: string, grateful: string, nextWeek: string) => {
    const existing = summaries.find(s => s.id === id);
    let newSummaries;
    if (existing) {
      newSummaries = summaries.map(s => s.id === id ? { 
        ...s, 
        reflectionLearned: learned, 
        reflectionImprove: improve, 
        reflectionGrateful: grateful,
        reflectionNextWeek: nextWeek,
        isCompleted: true 
      } : s);
    } else {
      return;
    }
    
    newSummaries = newSummaries.sort((a, b) => {
      const [anoA, mesA, diaA] = a.startDate.split('-').map(Number);
      const [anoB, mesB, diaB] = b.startDate.split('-').map(Number);
      return new Date(anoB, mesB - 1, diaB).getTime() - new Date(anoA, mesA - 1, diaA).getTime();
    }).slice(0, 4);
    saveSummaries(newSummaries);
  };

  const addSummary = (summary: WeeklySummaryData) => {
    const existing = summaries.find(s => s.id === summary.id);
    let newSummaries;
    if (existing) {
      newSummaries = summaries.map(s => s.id === summary.id ? summary : s);
    } else {
      newSummaries = [...summaries, summary];
    }
    newSummaries = newSummaries.sort((a, b) => {
      const [anoA, mesA, diaA] = a.startDate.split('-').map(Number);
      const [anoB, mesB, diaB] = b.startDate.split('-').map(Number);
      return new Date(anoB, mesB - 1, diaB).getTime() - new Date(anoA, mesA - 1, diaA).getTime();
    }).slice(0, 4);
    saveSummaries(newSummaries);
  };

  return {
    summaries,
    generateSummary,
    saveReflection,
    addSummary
  };
}
