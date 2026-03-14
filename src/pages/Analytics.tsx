import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis 
} from 'recharts';
import { subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart2, CheckSquare, Calendar, Target, Activity, Download, FileText, Database } from 'lucide-react';
import { getDataStringBrasil, deveMostrarTask } from '../utils/dataUtils';
import { generatePDFReport, exportDataJSON } from '../utils/exportUtils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export function Analytics() {
  const { tasks, habitos, metas, kpis, config, gamification, getLevelInfo } = useApp();
  const hoje = getDataStringBrasil();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExportPDF = (period: 'diario' | 'semanal' | 'mensal') => {
    const exportData = {
      tasks,
      habitos,
      metas,
      kpis,
      gamification,
      levelInfo: getLevelInfo(gamification.totalXP)
    };
    generatePDFReport(exportData, period);
  };

  const handleExportJSON = () => {
    const allData = {
      tasks,
      habitos,
      metas,
      kpis,
      config,
      gamification,
      timestamp: getDataStringBrasil()
    };
    exportDataJSON(allData);
  };

  // --- 1. OVERVIEW METRICS ---
  const overviewMetrics = useMemo(() => {
    // Tasks %
    const tasksHoje = tasks.filter(t => t.data === hoje && t.status !== 'cancelada' && (!t.deadline || t.deadline >= hoje) && deveMostrarTask(t, hoje));
    const tasksConcluidasHoje = tasksHoje.filter(t => t.status === 'concluida').length;
    const taxaTasks = tasksHoje.length > 0 ? Math.round((tasksConcluidasHoje / tasksHoje.length) * 100) : 0;

    // Habits %
    const [ano, mes, dia] = hoje.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    const diaSemana = dataObj.getDay();
    const habitosHoje = habitos.filter(h => h.diasSemana.includes(diaSemana));
    const habitosConcluidosHoje = habitosHoje.filter(h => h.conclusoes.some(c => c.data === hoje && c.concluido)).length;
    const taxaHabitos = habitosHoje.length > 0 ? Math.round((habitosConcluidosHoje / habitosHoje.length) * 100) : 0;

    // Metas Avg %
    const progressoMetas = metas.length > 0 ? Math.round(metas.reduce((acc, m) => acc + m.progresso, 0) / metas.length) : 0;

    // KPIs Avg %
    const progressoKPIs = kpis.length > 0 ? Math.round(kpis.reduce((acc, k) => {
      const p = (k.valorAtual / k.valorMeta) * 100;
      return acc + Math.min(p, 100);
    }, 0) / kpis.length) : 0;

    return { taxaTasks, taxaHabitos, progressoMetas, progressoKPIs };
  }, [tasks, habitos, metas, kpis, hoje]);

  // --- 2. HISTORICAL DATA (TASKS & HABITS) ---
  const historyData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const displayDate = format(date, 'dd/MM', { locale: ptBR });

      // Tasks
      const tasksCompleted = tasks.filter(t => t.data === dateStr && t.status === 'concluida').length;
      const tasksTotal = tasks.filter(t => t.data === dateStr && t.status !== 'cancelada' && (!t.deadline || t.deadline >= dateStr) && deveMostrarTask(t, dateStr)).length;

      // Habits
      const habitsForDay = habitos.filter(h => h.diasSemana.includes(date.getDay()));
      const habitsCompleted = habitsForDay.filter(h => h.conclusoes.some(c => c.data === dateStr && c.concluido)).length;
      const habitsPercentage = habitsForDay.length > 0 ? Math.round((habitsCompleted / habitsForDay.length) * 100) : 0;

      // Pomodoros
      const pomodoros = tasks.filter(t => t.data === dateStr).reduce((acc, t) => acc + (t.pomodorosFeitos || 0), 0);
      const minutosFoco = pomodoros * config.duracaoPomodoro;

      return {
        name: displayDate,
        Tarefas: tasksCompleted,
        TotalTarefas: tasksTotal,
        Habitos: habitsPercentage,
        MinutosFoco: minutosFoco,
      };
    });
  }, [tasks, habitos, config.duracaoPomodoro]);

  // --- 3. METAS DATA ---
  const metasPieData = useMemo(() => {
    const concluidas = metas.filter(m => m.status === 'concluida').length;
    const emAndamento = metas.filter(m => m.status === 'em_andamento').length;
    const naoIniciadas = metas.filter(m => m.status === 'nao_iniciada').length;
    return [
      { name: 'Concluídas', value: concluidas, fill: '#10b981' },
      { name: 'Em Andamento', value: emAndamento, fill: '#3b82f6' },
      { name: 'Não Iniciadas', value: naoIniciadas, fill: '#6b7280' },
    ].filter(d => d.value > 0);
  }, [metas]);

  const metasBarData = useMemo(() => {
    const periods = ['semanal', 'mensal', 'trimestral'];
    const colors = { semanal: '#3b82f6', mensal: '#22c55e', trimestral: '#8b5cf6' };
    return periods.map(p => {
      const periodMetas = metas.filter(m => m.periodo === p);
      return {
        name: p.charAt(0).toUpperCase() + p.slice(1),
        Total: periodMetas.length,
        Concluídas: periodMetas.filter(m => m.status === 'concluida').length,
        Pendentes: periodMetas.filter(m => m.status !== 'concluida').length,
        fill: colors[p as keyof typeof colors]
      };
    });
  }, [metas]);

  // --- 4. KPIS DATA ---
  const kpiBarData = useMemo(() => {
    return kpis.map(k => ({
      name: k.titulo,
      Atual: k.valorAtual,
      Meta: k.valorMeta,
      Progresso: Math.min(Math.round((k.valorAtual / k.valorMeta) * 100), 100)
    }));
  }, [kpis]);

  const kpiGaugeData = useMemo(() => {
    // Top 3 KPIs for gauges
    return kpis.slice(0, 3).map((k, i) => ({
      name: k.titulo,
      value: Math.min(Math.round((k.valorAtual / k.valorMeta) * 100), 100),
      fill: COLORS[i % COLORS.length]
    }));
  }, [kpis]);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-sec border border-border-subtle p-3 rounded-xl shadow-xl">
          <p className="text-text-main font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color || entry.payload.fill }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent-blue/10 rounded-xl">
            <BarChart2 size={28} className="text-accent-blue" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-serif font-bold tracking-tight text-text-main">Analytics</h1>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => handleExportPDF('semanal')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText size={16} strokeWidth={1.5} />
            Exportar Semana
          </Button>
          <Button 
            onClick={() => handleExportPDF('mensal')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText size={16} strokeWidth={1.5} />
            Exportar Mês
          </Button>
          <Button 
            onClick={handleExportJSON}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Database size={16} strokeWidth={1.5} />
            Baixar Dados
          </Button>
        </div>
      </div>

      {/* SEÇÃO 1: OVERVIEW DO DIA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between border-t-2 border-t-accent-blue">
          <div className="flex items-center gap-2 text-text-sec mb-2">
            <CheckSquare size={16} strokeWidth={1.5} />
            <span className="text-sm font-medium uppercase tracking-wider">Tasks Hoje</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-serif font-bold text-text-main">{overviewMetrics.taxaTasks}%</span>
          </div>
          <div className="w-full bg-bg-main h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-accent-blue h-full rounded-full" style={{ width: `${overviewMetrics.taxaTasks}%` }}></div>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-t-2 border-t-success">
          <div className="flex items-center gap-2 text-text-sec mb-2">
            <Calendar size={16} strokeWidth={1.5} />
            <span className="text-sm font-medium uppercase tracking-wider">Hábitos Hoje</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-serif font-bold text-text-main">{overviewMetrics.taxaHabitos}%</span>
          </div>
          <div className="w-full bg-bg-main h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-success h-full rounded-full" style={{ width: `${overviewMetrics.taxaHabitos}%` }}></div>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-t-2 border-t-accent-purple">
          <div className="flex items-center gap-2 text-text-sec mb-2">
            <Target size={16} strokeWidth={1.5} />
            <span className="text-sm font-medium uppercase tracking-wider">Metas (Média)</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-serif font-bold text-text-main">{overviewMetrics.progressoMetas}%</span>
          </div>
          <div className="w-full bg-bg-main h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-accent-purple h-full rounded-full" style={{ width: `${overviewMetrics.progressoMetas}%` }}></div>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-t-2 border-t-warning">
          <div className="flex items-center gap-2 text-text-sec mb-2">
            <Activity size={16} strokeWidth={1.5} />
            <span className="text-sm font-medium uppercase tracking-wider">KPIs (Média)</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-serif font-bold text-text-main">{overviewMetrics.progressoKPIs}%</span>
          </div>
          <div className="w-full bg-bg-main h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-warning h-full rounded-full" style={{ width: `${overviewMetrics.progressoKPIs}%` }}></div>
          </div>
        </Card>
      </div>

      {/* SEÇÃO 2 & 3: TASKS E HÁBITOS (HISTÓRICO) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-serif font-bold text-text-main mb-6 flex items-center gap-2">
            <CheckSquare size={20} className="text-accent-blue" strokeWidth={1.5} />
            Evolução de Tasks (7 dias)
          </h2>
          <div className="h-72 min-h-[288px]">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} className="dark:stroke-zinc-800" />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Tarefas" name="Concluídas" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="TotalTarefas" name="Total" fill="#a1a1aa" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-serif font-bold text-text-main mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-success" strokeWidth={1.5} />
            Consistência de Hábitos (%)
          </h2>
          <div className="h-72 min-h-[288px]">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} className="dark:stroke-zinc-800" />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="Habitos" name="Conclusão (%)" stroke="#10b981" strokeWidth={3} dot={{ fill: '#fafafa', stroke: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#10b981' }} className="dark:dot-fill-zinc-900" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* SEÇÃO 4: METAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-serif font-bold text-text-main mb-6 flex items-center gap-2">
            <Target size={20} className="text-accent-purple" strokeWidth={1.5} />
            Status das Metas
          </h2>
          <div className="h-72 min-h-[288px] flex items-center justify-center">
            {metasPieData.length > 0 ? (
              mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metasPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {metasPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )
            ) : (
              <p className="text-text-sec">Nenhuma meta cadastrada.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-serif font-bold text-text-main mb-6 flex items-center gap-2">
            <Target size={20} className="text-accent-purple" strokeWidth={1.5} />
            Metas por Período
          </h2>
          <div className="h-72 min-h-[288px]">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metasBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} className="dark:stroke-zinc-800" />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="Total" radius={[4, 4, 0, 0]} barSize={40}>
                    {metasBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* SEÇÃO 5: KPIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-serif font-bold text-text-main mb-6 flex items-center gap-2">
            <Activity size={20} className="text-warning" strokeWidth={1.5} />
            Progresso dos KPIs (Top 3)
          </h2>
          <div className="h-72 min-h-[288px] flex items-center justify-center">
            {kpiGaugeData.length > 0 ? (
              mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="30%" 
                    outerRadius="100%" 
                    barSize={15} 
                    data={kpiGaugeData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar
                      minAngle={15}
                      background={{ fill: '#e4e4e7' }}
                      clockWise
                      dataKey="value"
                      cornerRadius={10}
                    />
                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0 }} />
                    <RechartsTooltip content={<CustomTooltip />} />
                  </RadialBarChart>
                </ResponsiveContainer>
              )
            ) : (
              <p className="text-text-sec">Nenhum KPI cadastrado.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-serif font-bold text-text-main mb-6 flex items-center gap-2">
            <Activity size={20} className="text-warning" strokeWidth={1.5} />
            KPIs: Atual vs Meta
          </h2>
          <div className="h-72 min-h-[288px]">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} className="dark:stroke-zinc-800" />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="Atual" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#fafafa', stroke: '#f59e0b', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#f59e0b' }} className="dark:dot-fill-zinc-900" />
                  <Line type="monotone" dataKey="Meta" stroke="#a1a1aa" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
