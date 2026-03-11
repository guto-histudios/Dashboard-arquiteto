import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskCard } from '../components/tasks/TaskCard';
import { HabitoCard } from '../components/habitos/HabitoCard';
import { KPICard } from '../components/kpis/KPICard';
import { ImprevistoModal } from '../components/common/ImprevistoModal';
import { MementoMori } from '../components/common/MementoMori';
import { DailyQuote } from '../components/common/DailyQuote';
import { ProductivityWidget } from '../components/dashboard/ProductivityWidget';
import { ResumoSemanal } from '../components/dashboard/ResumoSemanal';
import { ProductivityComparison } from '../components/dashboard/ProductivityComparison';
import { getDataStringBrasil, formatarData, deveMostrarTask } from '../utils/dataUtils';
import { AlertTriangle, CheckCircle, Calendar, Target, Activity, Trophy, Star, Flame, Zap, Briefcase, Award, Crown, Shield, Mountain, Sun, Flag, TrendingUp, ChevronUp, ChevronsUp, Sunrise, Moon, Clock, Focus, Wind, Infinity as InfinityIcon } from 'lucide-react';
import { BadgeInfo } from '../types';

export function Dashboard() {
  const { tasks, habitos, kpis, mudarStatus, toggleConclusaoHabito, atualizarKPI, calcularProgressoHabitos, config, userProfile, gamification, getLevelInfo, badgesInfo } = useApp();
  const [isImprevistoOpen, setIsImprevistoOpen] = useState(false);
  const hoje = getDataStringBrasil();

  const tasksDoDia = tasks
    .filter(t => t.data === hoje && t.status !== 'cancelada' && !t.concluidaDefinitivamente)
    .filter(t => !t.deadline || t.deadline >= hoje)
    .filter(t => deveMostrarTask(t, hoje))
    .sort((a, b) => {
      if (a.horarioInicio && b.horarioInicio) return a.horarioInicio.localeCompare(b.horarioInicio);
      if (a.horarioInicio) return -1;
      if (b.horarioInicio) return 1;
      return a.duracao - b.duracao;
    });
  const [ano, mes, dia] = hoje.split('-').map(Number);
  const dataObj = new Date(ano, mes - 1, dia);
  const diaSemanaHoje = dataObj.getDay();
  const habitosDoDia = habitos.filter(h => h.diasSemana.includes(diaSemanaHoje));
  
  const tasksConcluidas = tasksDoDia.filter(t => t.status === 'concluida').length;
  const progressoHabitos = calcularProgressoHabitos(hoje);
  
  const pomodorosHoje = tasksDoDia.reduce((acc, task) => acc + (task.pomodorosFeitos || 0), 0);
  const minutosFoco = pomodorosHoje * config.duracaoPomodoro;

  const handleImprevisto = (motivo: string, tempoPerdido: number, adiarTodas: boolean) => {
    console.log("Imprevisto:", { motivo, tempoPerdido, adiarTodas });
    // Logic to handle imprevisto would go here (e.g., rescheduling tasks)
    setIsImprevistoOpen(false);
  };

  const levelInfo = getLevelInfo(gamification.totalXP);

  const renderIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Star': return <Star className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Target': return <Target className={className} />;
      case 'Activity': return <Activity className={className} />;
      case 'CheckCircle': return <CheckCircle className={className} />;
      case 'Briefcase': return <Briefcase className={className} />;
      case 'Award': return <Award className={className} />;
      case 'Crown': return <Crown className={className} />;
      case 'Calendar': return <Calendar className={className} />;
      case 'Shield': return <Shield className={className} />;
      case 'Mountain': return <Mountain className={className} />;
      case 'Sun': return <Sun className={className} />;
      case 'Flag': return <Flag className={className} />;
      case 'TrendingUp': return <TrendingUp className={className} />;
      case 'ChevronUp': return <ChevronUp className={className} />;
      case 'ChevronsUp': return <ChevronsUp className={className} />;
      case 'Sunrise': return <Sunrise className={className} />;
      case 'Moon': return <Moon className={className} />;
      case 'Clock': return <Clock className={className} />;
      case 'Focus': return <Focus className={className} />;
      case 'Wind': return <Wind className={className} />;
      case 'Infinity': return <InfinityIcon className={className} />;
      case 'Fire': return <Flame className={className} />;
      default: return <Trophy className={className} />;
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-1">Dashboard</h1>
          <p className="text-text-sec font-medium">{formatarData(hoje, "EEEE, d 'de' MMMM 'de' yyyy")}</p>
        </div>
        <button 
          onClick={() => setIsImprevistoOpen(true)}
          className="bg-bg-sec border border-error/30 text-error hover:bg-error hover:text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 group"
        >
          <AlertTriangle size={20} className="group-hover:animate-pulse" />
          <span className="font-medium">Alerta de Imprevisto</span>
        </button>
      </div>

      {userProfile?.dataNascimento && userProfile?.expectativaVida && (
        <div className="mb-8">
          <MementoMori />
        </div>
      )}

      {/* Productivity Widget */}
      <ProductivityWidget />

      {/* Comparação de Produtividade */}
      <ProductivityComparison />

      {/* Resumo Semanal */}
      <ResumoSemanal />

      {/* Gamification Section */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-accent-purple/10 to-transparent rounded-bl-full -z-10"></div>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          
          {/* Level Info */}
          <div className="flex items-center gap-6 flex-1 w-full">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full border-4 border-bg-sec flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl relative z-10">
                <div className="text-center">
                  <div className="text-xs text-text-sec font-bold uppercase tracking-wider">Lvl</div>
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-blue leading-none">
                    {levelInfo.nivel}
                  </div>
                </div>
              </div>
              {/* Spinning border effect */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-purple border-r-accent-blue animate-spin-slow -z-0" style={{ margin: '-4px' }}></div>
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h3 className="text-xl font-bold">Progresso</h3>
                  <p className="text-sm text-text-sec">{gamification.totalXP} XP Total</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-accent-purple">{levelInfo.xpAtualNoNivel}</span>
                  <span className="text-sm text-text-sec"> / {levelInfo.xpParaProximoNivel} XP</span>
                </div>
              </div>
              <div className="w-full bg-bg-sec rounded-full h-3 border border-border-subtle overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-accent-purple to-accent-blue h-full rounded-full transition-all duration-1000 ease-out relative" 
                  style={{ width: `${levelInfo.progressoPercentual}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-white/20 to-transparent"></div>
                </div>
              </div>
              <p className="text-xs text-text-sec mt-2 text-right">Faltam {levelInfo.xpParaProximoNivel - levelInfo.xpAtualNoNivel} XP para o Nível {levelInfo.nivel + 1}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex-1 w-full md:border-l md:border-border-subtle md:pl-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Trophy size={20} className="text-warning" />
                Conquistas
              </h3>
              <span className="text-sm text-text-sec font-medium">{gamification.badges.length} desbloqueadas</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.values(badgesInfo).map((badge: BadgeInfo) => {
                const isUnlocked = gamification.badges.includes(badge.id);
                return (
                  <div 
                    key={badge.id}
                    className={`relative group p-3 rounded-xl border transition-all duration-300 flex items-center justify-center
                      ${isUnlocked 
                        ? 'bg-bg-sec border-border-subtle hover:border-accent-purple/50 hover:bg-accent-purple/10' 
                        : 'bg-bg-sec/50 border-transparent opacity-40 grayscale'}`}
                    title={badge.descricao}
                  >
                    {renderIcon(badge.icone, `w-6 h-6 ${isUnlocked ? badge.cor : 'text-text-sec'}`)}
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 bg-gray-900 border border-border-subtle rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      <p className="font-bold text-sm text-white">{badge.nome}</p>
                      <p className="text-xs text-text-sec">{badge.descricao}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Resumo do Dia e Citação */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-text-sec font-medium">Tarefas Concluídas</h3>
              <div className="p-2 bg-accent-blue/10 rounded-lg">
                <CheckCircle className="text-accent-blue" size={24} />
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">
              {tasksConcluidas} <span className="text-text-sec text-xl font-medium">/ {tasksDoDia.length}</span>
            </div>
            <div className="w-full bg-bg-sec rounded-full h-2 border border-border-subtle overflow-hidden">
              <div className="bg-gradient-to-r from-accent-blue to-accent-purple h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(tasksConcluidas / Math.max(tasksDoDia.length, 1)) * 100}%` }}></div>
            </div>
          </div>

          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-text-sec font-medium">Hábitos</h3>
              <div className="p-2 bg-success/10 rounded-lg">
                <Calendar className="text-success" size={24} />
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{Math.round(progressoHabitos)}%</div>
            <div className="w-full bg-bg-sec rounded-full h-2 border border-border-subtle overflow-hidden">
              <div className="bg-gradient-to-r from-success to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressoHabitos}%` }}></div>
            </div>
          </div>

          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-purple/5 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-text-sec font-medium">Foco (Pomodoro)</h3>
              <div className="p-2 bg-accent-purple/10 rounded-lg">
                <Target className="text-accent-purple" size={24} />
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{minutosFoco} <span className="text-text-sec text-xl font-medium">min</span></div>
            <p className="text-sm text-text-sec font-medium mt-2">{pomodorosHoje} ciclos concluídos</p>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <DailyQuote />
        </div>
      </div>

      {/* Tasks e Hábitos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-accent-blue/10 rounded-lg">
              <CheckCircle size={24} className="text-accent-blue" />
            </div>
            Tarefas de Hoje
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tasksDoDia.length > 0 ? (
              tasksDoDia.map(task => (
                <TaskCard key={task.id} task={task} onStatusChange={mudarStatus} />
              ))
            ) : (
              <div className="col-span-2 glass-card p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-bg-sec rounded-full flex items-center justify-center mb-4 border border-border-subtle">
                  <CheckCircle size={32} className="text-text-sec" />
                </div>
                <h3 className="text-lg font-medium mb-2">Tudo limpo por aqui</h3>
                <p className="text-text-sec">Nenhuma tarefa para hoje. Aproveite o dia!</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-10">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-success/10 rounded-lg">
                <Calendar size={24} className="text-success" />
              </div>
              Hábitos Diários
            </h2>
            <div className="space-y-4">
              {habitosDoDia.length > 0 ? (
                habitosDoDia.map(habito => (
                  <HabitoCard key={habito.id} habito={habito} onToggle={toggleConclusaoHabito} />
                ))
              ) : (
                <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
                  <Calendar size={32} className="text-text-sec mb-3" />
                  <p className="text-text-sec">Nenhum hábito para hoje.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-accent-purple/10 rounded-lg">
                <Activity size={24} className="text-accent-purple" />
              </div>
              KPIs Principais
            </h2>
            <div className="space-y-4">
              {kpis.slice(0, 3).map(kpi => (
                <KPICard key={kpi.id} kpi={kpi} onUpdate={atualizarKPI} />
              ))}
              {kpis.length === 0 && (
                <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
                  <Activity size={32} className="text-text-sec mb-3" />
                  <p className="text-text-sec">Nenhum KPI definido.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ImprevistoModal 
        isOpen={isImprevistoOpen} 
        onClose={() => setIsImprevistoOpen(false)} 
        onConfirm={handleImprevisto} 
      />
    </div>
  );
}

