import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { getDataStringBrasil, deveMostrarTask } from '../../utils/dataUtils';
import { subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { Battery, CheckCircle, Calendar, Target, Activity } from 'lucide-react';

export function ProductivityWidget() {
  const { tasks, habitos } = useApp();
  const hoje = getDataStringBrasil();
  const [mounted, setMounted] = useState(false);

  // Energy level state (1-5)
  const [energyLevel, setEnergyLevel] = useState(3);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const savedEnergy = localStorage.getItem(`energy_${hoje}`);
    if (savedEnergy) {
      setEnergyLevel(Number(savedEnergy));
    }
  }, [hoje]);

  const handleEnergyChange = (level: number) => {
    setEnergyLevel(level);
    localStorage.setItem(`energy_${hoje}`, level.toString());
  };

  // Calculate metrics for a specific date
  const calculateMetricsForDate = (dateStr: string, dateObj: Date) => {
    // Tasks
    const tasksDoDia = tasks.filter(t => t.data === dateStr && t.status !== 'cancelada' && (!t.deadline || t.deadline >= dateStr) && deveMostrarTask(t, dateStr));
    const tasksConcluidas = tasksDoDia.filter(t => t.status === 'concluida').length;
    const totalTasks = tasksDoDia.length;
    const tasksScore = totalTasks > 0 ? (tasksConcluidas / totalTasks) * 100 : 0;

    // Habits
    const diaSemana = dateObj.getDay();
    const habitosDoDia = habitos.filter(h => h.diasSemana.includes(diaSemana));
    const habitosConcluidos = habitosDoDia.filter(h => h.conclusoes.some(c => c.data === dateStr && c.concluido)).length;
    const totalHabitos = habitosDoDia.length;
    const habitosScore = totalHabitos > 0 ? (habitosConcluidos / totalHabitos) * 100 : 0;

    // Pomodoros
    const pomodorosFeitos = tasksDoDia.reduce((acc, task) => acc + (task.pomodorosFeitos || 0), 0);
    const pomodorosScore = Math.min((pomodorosFeitos / 8) * 100, 100); // Assume 8 is the goal for 100%

    // Energy
    const savedEnergy = localStorage.getItem(`energy_${dateStr}`);
    const energy = dateStr === hoje ? energyLevel : (savedEnergy ? Number(savedEnergy) : 3);
    const energyScore = (energy / 5) * 100;

    // Total Score
    // 60% tasks, 40% habits
    let totalScore = 0;
    let weightSum = 0;

    if (totalTasks > 0) {
      totalScore += tasksScore * 0.6;
      weightSum += 0.6;
    }
    if (totalHabitos > 0) {
      totalScore += habitosScore * 0.4;
      weightSum += 0.4;
    }

    // Normalize if some weights are missing (e.g. no tasks or habits today)
    const finalScore = weightSum > 0 ? Math.round(totalScore / weightSum) : 0;

    return {
      score: finalScore,
      tasksConcluidas,
      totalTasks,
      habitosConcluidos,
      totalHabitos,
      pomodorosFeitos
    };
  };

  const todayMetrics = useMemo(() => calculateMetricsForDate(hoje, new Date()), [tasks, habitos, hoje, energyLevel]);

  const historyData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const metrics = calculateMetricsForDate(dateStr, date);
      return {
        name: format(date, 'dd/MM'),
        score: metrics.score
      };
    });
  }, [tasks, habitos, hoje, energyLevel]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success stroke-success';
    if (score >= 40) return 'text-warning stroke-warning';
    return 'text-error stroke-error';
  };

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (todayMetrics.score / 100) * circumference;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-sec border border-border-subtle p-2 rounded-lg shadow-xl text-xs">
          <p className="text-white font-bold">{label}</p>
          <p className="text-accent-purple">Score: {payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-accent-purple/5 to-transparent rounded-bl-full -z-10"></div>
      
      <div className="flex flex-col lg:flex-row items-center gap-8">
        
        {/* Score Circle */}
        <div className="relative flex items-center justify-center flex-shrink-0">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              className="text-bg-sec stroke-current"
              strokeWidth="8"
              cx="64"
              cy="64"
              r={radius}
              fill="transparent"
            />
            <circle
              className={`${getScoreColor(todayMetrics.score).split(' ')[1]} transition-all duration-1000 ease-out`}
              strokeWidth="8"
              strokeLinecap="round"
              cx="64"
              cy="64"
              r={radius}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className={`text-3xl font-bold ${getScoreColor(todayMetrics.score).split(' ')[0]}`}>
              {todayMetrics.score}%
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          
          {/* Metrics */}
          <div className="flex flex-col justify-center">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity size={20} className="text-accent-purple" />
              Produtividade
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-sec">
                  <CheckCircle size={16} />
                  <span className="text-sm">Tarefas (60%)</span>
                </div>
                <span className="font-bold text-sm">{todayMetrics.tasksConcluidas}/{todayMetrics.totalTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-sec">
                  <Calendar size={16} />
                  <span className="text-sm">Hábitos (40%)</span>
                </div>
                <span className="font-bold text-sm">{todayMetrics.habitosConcluidos}/{todayMetrics.totalHabitos}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-sec">
                  <Target size={16} />
                  <span className="text-sm">Pomodoros</span>
                </div>
                <span className="font-bold text-sm">{todayMetrics.pomodorosFeitos}</span>
              </div>
            </div>
          </div>

          {/* Energy Level */}
          <div className="flex flex-col justify-center md:border-l border-border-subtle md:pl-6">
            <div className="flex items-center gap-2 text-text-sec mb-4">
              <Battery size={16} />
              <span className="text-sm font-medium">Nível de Energia</span>
            </div>
            <div className="flex gap-2 justify-between max-w-[200px]">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => handleEnergyChange(level)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-sm font-bold ${
                    energyLevel === level 
                      ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/20 scale-110' 
                      : 'bg-bg-sec text-text-sec hover:bg-border-subtle'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-sec mt-3 text-center max-w-[200px]">
              {energyLevel === 1 && "Exausto"}
              {energyLevel === 2 && "Cansado"}
              {energyLevel === 3 && "Normal"}
              {energyLevel === 4 && "Disposto"}
              {energyLevel === 5 && "Energizado"}
            </p>
          </div>

          {/* Evolution Chart */}
          <div className="flex flex-col justify-center md:border-l border-border-subtle md:pl-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-sec">Evolução (7 dias)</span>
            </div>
            <div className="h-24 min-h-[96px] w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="var(--theme-primary)" 
                      strokeWidth={3} 
                      dot={{ fill: 'var(--theme-primary)', r: 3, strokeWidth: 0 }} 
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
