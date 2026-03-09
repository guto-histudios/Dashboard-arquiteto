import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { BADGES_INFO } from '../hooks/useGamification';
import { format, subDays, eachDayOfInterval, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { Trophy, Star, Target, CheckCircle, Calendar, Clock, Activity, Flame, Zap, Award, TrendingUp } from 'lucide-react';

export function Perfil() {
  const { userProfile, gamification, getLevelInfo, tasks, habitos, metas } = useApp();

  const levelInfo = getLevelInfo(gamification.totalXP);
  const userName = userProfile?.nome || 'Arquiteto';

  // Calculate general stats
  const totalTasksCompleted = tasks.filter(t => t.status === 'concluida').length;
  
  const totalHabitsCompleted = habitos.reduce((acc, h) => {
    return acc + h.conclusoes.filter(c => c.concluido).length;
  }, 0);

  const totalPomodoros = tasks.reduce((acc, t) => acc + (t.pomodorosFeitos || 0), 0);
  const totalMetasCompleted = metas.filter(m => m.status === 'concluida').length;

  // Calculate days using the system (approximate based on oldest task/habit, or default to 1)
  const daysUsingSystem = useMemo(() => {
    let oldestDate = new Date();
    tasks.forEach(t => {
      const d = new Date(t.data);
      if (d < oldestDate) oldestDate = d;
    });
    habitos.forEach(h => {
      h.conclusoes.forEach(c => {
        const d = new Date(c.data);
        if (d < oldestDate) oldestDate = d;
      });
    });
    const diff = differenceInDays(new Date(), oldestDate);
    return diff > 0 ? diff : 1;
  }, [tasks, habitos]);

  // Calculate XP history for the last 14 days
  const xpHistory = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 13);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      
      const tasksConcluidas = tasks.filter(t => t.data === dateStr && t.status === 'concluida').length;
      
      const diaSemana = day.getDay();
      const habitosDoDia = habitos.filter(h => h.diasSemana.includes(diaSemana));
      const habitosConcluidos = habitosDoDia.filter(h => h.conclusoes.some(c => c.data === dateStr && c.concluido)).length;
      
      const xp = (tasksConcluidas * 10) + (habitosConcluidos * 5);

      return {
        name: format(day, 'dd/MM'),
        xp: xp
      };
    });
  }, [tasks, habitos]);

  const allBadges = Object.values(BADGES_INFO);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Star': return <Star size={24} />;
      case 'Flame': return <Flame size={24} />;
      case 'Zap': return <Zap size={24} />;
      case 'Target': return <Target size={24} />;
      case 'Activity': return <Activity size={24} />;
      case 'CheckCircle': return <CheckCircle size={24} />;
      default: return <Award size={24} />;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-sec border border-border-subtle p-3 rounded-xl shadow-xl">
          <p className="text-text-sec text-xs mb-1">{label}</p>
          <p className="text-accent-purple font-bold flex items-center gap-1">
            <Star size={14} />
            {payload[0].value} XP ganhos
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header Profile */}
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-accent-purple/20 via-accent-blue/5 to-transparent rounded-bl-full -z-10"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-accent-purple flex items-center justify-center bg-bg-main shadow-[0_0_30px_rgba(139,92,246,0.3)]">
              <span className="text-5xl font-black bg-gradient-to-br from-accent-purple to-accent-blue bg-clip-text text-transparent">
                {levelInfo.nivel}
              </span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-bg-sec rounded-full p-2 border-2 border-border-subtle shadow-lg">
              <Trophy size={24} className="text-warning" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left w-full">
            <h1 className="text-4xl font-bold text-white mb-2">{userName}</h1>
            <p className="text-text-sec text-lg mb-6 flex items-center justify-center md:justify-start gap-2">
              <Star size={18} className="text-accent-blue" />
              {gamification.totalXP.toLocaleString()} XP Total Acumulado
            </p>

            <div className="space-y-2 max-w-2xl">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-accent-purple">Nível {levelInfo.nivel}</span>
                <span className="text-text-sec">{levelInfo.xpAtualNoNivel} / {levelInfo.xpParaProximoNivel} XP</span>
              </div>
              <div className="w-full bg-bg-main rounded-full h-3 border border-border-subtle overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-accent-purple to-accent-blue h-full rounded-full transition-all duration-1000 relative overflow-hidden"
                  style={{ width: `${levelInfo.progressoPercentual}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite] -skew-x-12"></div>
                </div>
              </div>
              <p className="text-xs text-text-sec text-right">
                Faltam {levelInfo.xpParaProximoNivel - levelInfo.xpAtualNoNivel} XP para o Nível {levelInfo.nivel + 1}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Stats Grid */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Activity className="text-accent-blue" size={24} />
            Estatísticas Gerais
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-sec/50 border border-border-subtle p-4 rounded-xl flex flex-col items-center justify-center text-center hover:bg-bg-sec transition-colors">
              <Flame size={24} className="text-orange-500 mb-2" />
              <span className="text-2xl font-bold text-white">{gamification.streakDias}</span>
              <span className="text-xs text-text-sec mt-1 uppercase tracking-wider">Dias Seguidos</span>
            </div>
            
            <div className="bg-bg-sec/50 border border-border-subtle p-4 rounded-xl flex flex-col items-center justify-center text-center hover:bg-bg-sec transition-colors">
              <CheckCircle size={24} className="text-success mb-2" />
              <span className="text-2xl font-bold text-white">{totalTasksCompleted}</span>
              <span className="text-xs text-text-sec mt-1 uppercase tracking-wider">Tarefas Feitas</span>
            </div>

            <div className="bg-bg-sec/50 border border-border-subtle p-4 rounded-xl flex flex-col items-center justify-center text-center hover:bg-bg-sec transition-colors">
              <Calendar size={24} className="text-accent-blue mb-2" />
              <span className="text-2xl font-bold text-white">{totalHabitsCompleted}</span>
              <span className="text-xs text-text-sec mt-1 uppercase tracking-wider">Hábitos Feitos</span>
            </div>

            <div className="bg-bg-sec/50 border border-border-subtle p-4 rounded-xl flex flex-col items-center justify-center text-center hover:bg-bg-sec transition-colors">
              <Clock size={24} className="text-accent-purple mb-2" />
              <span className="text-2xl font-bold text-white">{totalPomodoros}</span>
              <span className="text-xs text-text-sec mt-1 uppercase tracking-wider">Pomodoros</span>
            </div>

            <div className="bg-bg-sec/50 border border-border-subtle p-4 rounded-xl flex flex-col items-center justify-center text-center hover:bg-bg-sec transition-colors">
              <Target size={24} className="text-warning mb-2" />
              <span className="text-2xl font-bold text-white">{totalMetasCompleted}</span>
              <span className="text-xs text-text-sec mt-1 uppercase tracking-wider">Metas Atingidas</span>
            </div>

            <div className="bg-bg-sec/50 border border-border-subtle p-4 rounded-xl flex flex-col items-center justify-center text-center hover:bg-bg-sec transition-colors">
              <Activity size={24} className="text-emerald-400 mb-2" />
              <span className="text-2xl font-bold text-white">{daysUsingSystem}</span>
              <span className="text-xs text-text-sec mt-1 uppercase tracking-wider">Dias no App</span>
            </div>
          </div>
        </div>

        {/* Evolution Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <TrendingUp className="text-accent-purple" size={24} />
            Evolução de XP (Últimos 14 dias)
          </h2>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={xpHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--theme-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--theme-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="xp" 
                  stroke="var(--theme-primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorXp)" 
                  activeDot={{ r: 6, fill: 'var(--theme-primary)', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Badges Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award className="text-warning" size={24} />
            Conquistas e Badges
          </h2>
          <span className="bg-bg-sec px-3 py-1 rounded-full text-sm font-medium border border-border-subtle">
            {gamification.badges.length} / {allBadges.length} Desbloqueados
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {allBadges.map((badge) => {
            const isUnlocked = gamification.badges.includes(badge.id);
            
            return (
              <div 
                key={badge.id}
                className={`relative flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-300 ${
                  isUnlocked 
                    ? 'bg-bg-sec/80 border-border-subtle hover:border-accent-purple/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:-translate-y-1' 
                    : 'bg-bg-main/50 border-transparent opacity-50 grayscale'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-inner ${
                  isUnlocked ? 'bg-bg-main' : 'bg-bg-sec'
                }`}>
                  <div className={isUnlocked ? badge.cor : 'text-gray-500'}>
                    {getIconComponent(badge.icone)}
                  </div>
                </div>
                <h3 className={`text-sm font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-text-sec'}`}>
                  {badge.nome}
                </h3>
                <p className="text-xs text-text-sec leading-tight">
                  {badge.descricao}
                </p>
                
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-bg-main/90 rounded-2xl backdrop-blur-sm">
                    <span className="text-xs font-bold text-text-sec uppercase tracking-wider">Bloqueado</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
