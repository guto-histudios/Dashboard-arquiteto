import React from 'react';
import { useApp } from '../contexts/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, CheckCircle2, TrendingUp, Award, RefreshCw } from 'lucide-react';

export function RevisaoTrimestral() {
  const { quarterlyReports, generateQuarterlyReport } = useApp();
  const relatorioAtual = quarterlyReports[quarterlyReports.length - 1];

  const handleGerar = () => {
    generateQuarterlyReport();
  };

  if (!relatorioAtual) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Revisão Trimestral</h1>
        <p className="mb-6">Nenhuma revisão encontrada. Deseja gerar agora?</p>
        <button onClick={handleGerar} className="btn-primary">Gerar Revisão</button>
      </div>
    );
  }

  const chartData = [
    { name: 'Metas', valor: relatorioAtual.metasConcluidas },
    { name: 'KPIs', valor: relatorioAtual.kpisAtingidos },
    { name: 'Tasks', valor: relatorioAtual.tasksFeitas },
  ];

  return (
    <div className="space-y-8 pb-20">
      <h1 className="text-4xl font-bold">Revisão Trimestral</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-4 flex items-center gap-4">
          <CheckCircle2 className="text-success" size={32} />
          <div>
            <p className="text-sm text-text-sec">Metas Concluídas</p>
            <p className="text-2xl font-bold">{relatorioAtual.metasConcluidas} / {relatorioAtual.metasPlanejadas}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <TrendingUp className="text-accent-primary" size={32} />
          <div>
            <p className="text-sm text-text-sec">KPIs Atingidos</p>
            <p className="text-2xl font-bold">{relatorioAtual.kpisAtingidos} / {relatorioAtual.kpisPlanejados}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <Award className="text-accent-purple" size={32} />
          <div>
            <p className="text-sm text-text-sec">XP Ganho</p>
            <p className="text-2xl font-bold">{relatorioAtual.xpGanho}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <Calendar className="text-warning" size={32} />
          <div>
            <p className="text-sm text-text-sec">Streak Hábitos</p>
            <p className="text-2xl font-bold">{relatorioAtual.streakHabitos}</p>
          </div>
        </div>
      </div>

      <div className="card p-6 h-64">
        <h3 className="text-lg font-semibold mb-4">Evolução Geral</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }} />
            <Bar dataKey="valor" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Resumo</h3>
        <p className="text-text-sec">{relatorioAtual.resumo}</p>
      </div>

      <div className="flex gap-4">
        <button onClick={handleGerar} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={20} />
          Gerar Nova Revisão
        </button>
      </div>
    </div>
  );
}
