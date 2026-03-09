import { useState, useEffect, useCallback } from 'react';
import { startOfWeek, endOfWeek, format, isWithinInterval } from 'date-fns';
import { useApp } from '../contexts/AppContext';
import { deveMostrarTask } from '../utils/dataUtils';

export interface WeeklySummaryData {
  id: string;
  startDate: string;
  endDate: string;
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  metasCompleted: number;
  xpEarned: number;
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
    if (existing) return existing;

    const isDateInWeek = (dateStr: string) => {
      const d = new Date(dateStr);
      return isWithinInterval(d, { start, end });
    };

    const weekTasks = tasks.filter(t => isDateInWeek(t.data) && t.status !== 'cancelada' && (!t.deadline || t.deadline >= t.data) && deveMostrarTask(t, t.data));
    const tasksCompleted = weekTasks.filter(t => t.status === 'concluida').length;
    const tasksTotal = weekTasks.length;
    const totalPomodoros = weekTasks.reduce((acc, t) => acc + (t.pomodorosFeitos || 0), 0);

    let habitsCompleted = 0;
    habitos.forEach(h => {
      const conclusoesNaSemana = h.conclusoes.filter(c => c.concluido && isDateInWeek(c.data));
      habitsCompleted += conclusoesNaSemana.length;
    });

    const metasCompleted = metas.filter(m => m.status === 'concluida' && isDateInWeek(m.dataFim)).length;

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
    const xpEarned = (tasksCompleted * 10) + (habitsCompleted * 5) + (metasCompleted * 50);

    return {
      id,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      tasksCompleted,
      tasksTotal,
      habitsCompleted,
      metasCompleted,
      xpEarned,
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
    
    newSummaries = newSummaries.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 4);
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
    newSummaries = newSummaries.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 4);
    saveSummaries(newSummaries);
  };

  return {
    summaries,
    generateSummary,
    saveReflection,
    addSummary
  };
}
