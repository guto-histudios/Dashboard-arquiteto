import React, { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { getDataStringBrasil } from '../../utils/dataUtils';
import { subDays, startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, CheckSquare, Calendar, Clock, Star } from 'lucide-react';

export function ProductivityComparison() {
  const { tasks, habitos } = useApp();
  const hojeStr = getDataStringBrasil();
  const hojeDate = new Date();

  const [comparisonType, setComparisonType] = useState<'ontem' | 'media7' | 'semana'>('ontem');

  // Helper to get metrics for a specific date
  const getMetricsForDate = (dateObj: Date) => {
    const dateStr = format(dateObj, 'yyyy-MM-dd');
    const tasksConcluidas = tasks.filter(t => t.data === dateStr && t.status === 'concluida').length;
    
    const diaSemana = dateObj.getDay();
    const habitosDoDia = habitos.filter(h => h.diasSemana.includes(diaSemana));
    const habitosConcluidos = habitosDoDia.filter(h => h.conclusoes.some(c => c.data === dateStr && c.concluido)).length;
    
    const pomodoros = tasks.filter(t => t.data === dateStr).reduce((acc, t) => acc + (t.pomodorosFeitos || 0), 0);
    
    const xp = (tasksConcluidas * 10) + (habitosConcluidos * 5);

    return { tasks: tasksConcluidas, habits: habitosConcluidos, pomodoros, xp };
  };

  // Helper to get metrics for a date range
  const getMetricsForRange = (start: Date, end: Date) => {
    const days = eachDayOfInterval({ start, end });
    return days.reduce((acc, day) => {
      const m = getMetricsForDate(day);
      return {
        tasks: acc.tasks + m.tasks,
        habits: acc.habits + m.habits,
        pomodoros: acc.pomodoros + m.pomodoros,
        xp: acc.xp + m.xp
      };
    }, { tasks: 0, habits: 0, pomodoros: 0, xp: 0 });
  };

  const metrics = useMemo(() => {
    const today = getMetricsForDate(hojeDate);
    const yesterday = getMetricsForDate(subDays(hojeDate, 1));
    
    const last7DaysStart = subDays(hojeDate, 7);
    const last7DaysEnd = subDays(hojeDate, 1);
    const last7DaysTotal = getMetricsForRange(last7DaysStart, last7DaysEnd);
    const last7DaysAvg = {
      tasks: last7DaysTotal.tasks / 7,
      habits: last7DaysTotal.habits / 7,
      pomodoros: last7DaysTotal.pomodoros / 7,
      xp: last7DaysTotal.xp / 7,
    };

    const thisWeekStart = startOfWeek(hojeDate, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(hojeDate, { weekStartsOn: 1 });
    const thisWeek = getMetricsForRange(thisWeekStart, hojeDate); // Up to today

    const lastWeekStart = subDays(thisWeekStart, 7);
    const lastWeekEnd = subDays(thisWeekEnd, 7);
    const lastWeek = getMetricsForRange(lastWeekStart, lastWeekEnd);

    let current, previous, label;

    if (comparisonType === 'ontem') {
      current = today;
      previous = yesterday;
      label = 'vs Ontem';
    } else if (comparisonType === 'media7') {
      current = today;
      previous = last7DaysAvg;
      label = 'vs Média 7d';
    } else {
      current = thisWeek;
      previous = lastWeek;
      label = 'vs Sem. Passada';
    }

    return { current, previous, label };
  }, [tasks, habitos, hojeDate, comparisonType]);

  const calculateDiff = (curr: number, prev: number) => {
    if (prev === 0) {
      if (curr === 0) return { percent: 0, type: 'same' };
      return { percent: 100, type: 'up' };
    }
    const diff = ((curr - prev) / prev) * 100;
    if (diff > 0) return { percent: Math.round(diff), type: 'up' };
    if (diff < 0) return { percent: Math.abs(Math.round(diff)), type: 'down' };
    return { percent: 0, type: 'same' };
  };

  const renderCard = (title: string, icon: React.ReactNode, curr: number, prev: number, formatVal = (v: number) => Math.round(v * 10) / 10) => {
    const diff = calculateDiff(curr, prev);
    
    let colorClass = 'text-text-sec';
    let Icon = Minus;
    let sign = '';
    let bgClass = 'bg-bg-sec';

    if (diff.type === 'up') {
      colorClass = 'text-success';
      Icon = TrendingUp;
      sign = '+';
      bgClass = 'bg-success/10';
    } else if (diff.type === 'down') {
      colorClass = 'text-error';
      Icon = TrendingDown;
      sign = '-';
      bgClass = 'bg-error/10';
    }

    return (
      <div className="bg-bg-sec/50 border border-border-subtle p-4 rounded-xl flex flex-col justify-between hover:border-accent-blue/30 transition-colors">
        <div className="flex items-center gap-2 text-text-sec mb-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-end justify-between mt-2">
          <span className="text-2xl font-bold text-white">{formatVal(curr)}</span>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${bgClass} ${colorClass} text-xs font-bold`}>
            <Icon size={14} />
            <span>{sign}{diff.percent}%</span>
          </div>
        </div>
        <p className="text-xs text-text-sec mt-2 text-right">{metrics.label} ({formatVal(prev)})</p>
      </div>
    );
  };

  return (
    <div className="glass-card p-6 relative overflow-hidden mt-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="text-accent-blue" size={24} />
          Comparação de Produtividade
        </h2>
        
        <div className="flex flex-wrap bg-bg-sec p-1 rounded-xl border border-border-subtle">
          <button 
            onClick={() => setComparisonType('ontem')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${comparisonType === 'ontem' ? 'bg-accent-blue text-white shadow-md' : 'text-text-sec hover:text-white'}`}
          >
            Hoje vs Ontem
          </button>
          <button 
            onClick={() => setComparisonType('media7')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${comparisonType === 'media7' ? 'bg-accent-purple text-white shadow-md' : 'text-text-sec hover:text-white'}`}
          >
            Hoje vs Média 7d
          </button>
          <button 
            onClick={() => setComparisonType('semana')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${comparisonType === 'semana' ? 'bg-success text-white shadow-md' : 'text-text-sec hover:text-white'}`}
          >
            Semana Atual vs Passada
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {renderCard('Tasks Concluídas', <CheckSquare size={18} className="text-accent-blue" />, metrics.current.tasks, metrics.previous.tasks)}
        {renderCard('Hábitos Cumpridos', <Calendar size={18} className="text-success" />, metrics.current.habits, metrics.previous.habits)}
        {renderCard('XP Ganho', <Star size={18} className="text-warning" />, metrics.current.xp, metrics.previous.xp)}
        {renderCard('Pomodoros', <Clock size={18} className="text-accent-purple" />, metrics.current.pomodoros, metrics.previous.pomodoros)}
      </div>
    </div>
  );
}
