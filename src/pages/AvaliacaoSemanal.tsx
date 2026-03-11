import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { WeeklyReport } from '../types';
import { formatarData } from '../utils/dataUtils';
import { 
  Calendar, CheckCircle, Target, Activity, Trophy, 
  TrendingUp, TrendingDown, AlertCircle, Briefcase, 
  Heart, User, DollarSign, BookOpen, Trash2, ChevronRight
} from 'lucide-react';

export function AvaliacaoSemanal() {
  const { weeklyReports, generateWeeklyReport, deleteWeeklyReport } = useApp();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    weeklyReports.length > 0 ? weeklyReports[0].id : null
  );

  const handleGenerate = () => {
    const newReport = generateWeeklyReport();
    setSelectedReportId(newReport.id);
  };

  const selectedReport = weeklyReports.find(r => r.id === selectedReportId);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Avaliação Semanal</h1>
          <p className="text-text-sec">Acompanhe sua evolução e ajuste sua rota.</p>
        </div>
        
        <button 
          onClick={handleGenerate}
          className="btn-primary flex items-center gap-2"
        >
          <Activity size={20} />
          Gerar Novo Relatório
        </button>
      </div>

      {weeklyReports.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-accent-blue/10 rounded-full flex items-center justify-center mb-4">
            <Calendar className="text-accent-blue" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Nenhum relatório gerado</h2>
          <p className="text-text-sec max-w-md mb-6">
            Gere seu primeiro relatório semanal para analisar sua produtividade, consistência em hábitos e progresso de metas.
          </p>
          <button onClick={handleGenerate} className="btn-primary">
            Gerar Meu Primeiro Relatório
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar de Histórico */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Histórico</h3>
            <div className="flex flex-col gap-2">
              {weeklyReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`p-4 rounded-xl text-left transition-all flex items-center justify-between group ${
                    selectedReportId === report.id 
                      ? 'bg-accent-blue/20 border border-accent-blue/50' 
                      : 'glass-card hover:bg-bg-sec'
                  }`}
                >
                  <div>
                    <p className={`font-bold ${selectedReportId === report.id ? 'text-accent-blue' : 'text-white'}`}>
                      {formatarData(report.dataInicio)}
                    </p>
                    <p className="text-xs text-text-sec">até {formatarData(report.dataFim)}</p>
                  </div>
                  <ChevronRight size={16} className={selectedReportId === report.id ? 'text-accent-blue' : 'text-text-sec'} />
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo do Relatório */}
          {selectedReport && (
            <div className="lg:col-span-3 space-y-8">
              {/* Cabeçalho do Relatório */}
              <div className="glass-card p-6 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Relatório da Semana
                  </h2>
                  <p className="text-text-sec">
                    {formatarData(selectedReport.dataInicio)} a {formatarData(selectedReport.dataFim)}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir este relatório?')) {
                      deleteWeeklyReport(selectedReport.id);
                      if (selectedReportId === selectedReport.id) {
                        setSelectedReportId(weeklyReports.length > 1 ? weeklyReports[0].id : null);
                      }
                    }
                  }}
                  className="p-2 text-text-sec hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                  title="Excluir Relatório"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              {/* Resumo */}
              <div className="glass-card p-6 border-l-4 border-accent-blue">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Activity size={20} className="text-accent-blue" />
                  Visão Geral
                </h3>
                <p className="text-text-main text-lg leading-relaxed">
                  {selectedReport.resumo}
                </p>
              </div>

              {/* Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-text-sec font-medium">Tarefas</h4>
                    <CheckCircle className="text-success" size={20} />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {selectedReport.tasksConcluidas} <span className="text-lg text-text-sec">/ {selectedReport.tasksPlanejadas}</span>
                  </div>
                  <div className="w-full bg-bg-main h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-success h-full rounded-full"
                      style={{ width: `${selectedReport.tasksPlanejadas > 0 ? (selectedReport.tasksConcluidas / selectedReport.tasksPlanejadas) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-text-sec font-medium">Hábitos</h4>
                    <Activity className="text-accent-blue" size={20} />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {selectedReport.habitosConcluidos} <span className="text-lg text-text-sec">/ {selectedReport.habitosPlanejados}</span>
                  </div>
                  <div className="w-full bg-bg-main h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-accent-blue h-full rounded-full"
                      style={{ width: `${selectedReport.habitosPlanejados > 0 ? (selectedReport.habitosConcluidos / selectedReport.habitosPlanejados) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-text-sec font-medium">Metas</h4>
                    <Target className="text-accent-purple" size={20} />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {selectedReport.metasAtingidas} <span className="text-lg text-text-sec">/ {selectedReport.metasPlanejadas}</span>
                  </div>
                  <div className="w-full bg-bg-main h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-accent-purple h-full rounded-full"
                      style={{ width: `${selectedReport.metasPlanejadas > 0 ? (selectedReport.metasAtingidas / selectedReport.metasPlanejadas) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Gamification Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
                  <Trophy className="text-yellow-500 mb-2" size={24} />
                  <p className="text-2xl font-bold text-white">{selectedReport.xpGanho}</p>
                  <p className="text-xs text-text-sec uppercase tracking-wider">XP Ganho</p>
                </div>
                <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
                  <Activity className="text-red-500 mb-2" size={24} />
                  <p className="text-2xl font-bold text-white">{selectedReport.pomodorosCompletados}</p>
                  <p className="text-xs text-text-sec uppercase tracking-wider">Pomodoros</p>
                </div>
                <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
                  <TrendingUp className="text-orange-500 mb-2" size={24} />
                  <p className="text-2xl font-bold text-white">{selectedReport.streakAtual}</p>
                  <p className="text-xs text-text-sec uppercase tracking-wider">Dias de Streak</p>
                </div>
                <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
                  <Star className="text-accent-purple mb-2" size={24} />
                  <p className="text-2xl font-bold text-white">Nvl {selectedReport.nivelAtual}</p>
                  <p className="text-xs text-text-sec uppercase tracking-wider">Nível Atual</p>
                </div>
              </div>

              {/* Análise Detalhada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 border-t-4 border-success">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-success" />
                    O que foi bem
                  </h3>
                  <ul className="space-y-3">
                    {selectedReport.pontosPositivos.length > 0 ? (
                      selectedReport.pontosPositivos.map((ponto, i) => (
                        <li key={i} className="flex items-start gap-2 text-text-main">
                          <CheckCircle size={16} className="text-success mt-1 shrink-0" />
                          <span>{ponto}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-text-sec italic">Sem pontos de destaque nesta semana.</li>
                    )}
                  </ul>
                </div>

                <div className="glass-card p-6 border-t-4 border-warning">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingDown size={20} className="text-warning" />
                    Pontos de Melhoria
                  </h3>
                  <ul className="space-y-3">
                    {selectedReport.pontosMelhoria.length > 0 ? (
                      selectedReport.pontosMelhoria.map((ponto, i) => (
                        <li key={i} className="flex items-start gap-2 text-text-main">
                          <AlertCircle size={16} className="text-warning mt-1 shrink-0" />
                          <span>{ponto}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-text-sec italic">Excelente! Nenhum ponto crítico de melhoria.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Pendências */}
              {selectedReport.pendencias.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertCircle size={20} className="text-danger" />
                    Ficou Pendente
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.pendencias.map((pendencia, i) => (
                      <span key={i} className="px-3 py-1 bg-danger/10 text-danger rounded-full text-sm">
                        {pendencia}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sugestões por Área */}
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-6">Sugestões de Evolução</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedReport.sugestoesAreas.carreira && (
                    <div className="p-4 bg-bg-main rounded-xl border border-border-subtle">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase size={18} className="text-blue-400" />
                        <h4 className="font-bold text-white">Carreira</h4>
                      </div>
                      <p className="text-sm text-text-sec">{selectedReport.sugestoesAreas.carreira}</p>
                    </div>
                  )}
                  {selectedReport.sugestoesAreas.saude && (
                    <div className="p-4 bg-bg-main rounded-xl border border-border-subtle">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart size={18} className="text-red-400" />
                        <h4 className="font-bold text-white">Saúde</h4>
                      </div>
                      <p className="text-sm text-text-sec">{selectedReport.sugestoesAreas.saude}</p>
                    </div>
                  )}
                  {selectedReport.sugestoesAreas.pessoal && (
                    <div className="p-4 bg-bg-main rounded-xl border border-border-subtle">
                      <div className="flex items-center gap-2 mb-2">
                        <User size={18} className="text-emerald-400" />
                        <h4 className="font-bold text-white">Pessoal</h4>
                      </div>
                      <p className="text-sm text-text-sec">{selectedReport.sugestoesAreas.pessoal}</p>
                    </div>
                  )}
                  {selectedReport.sugestoesAreas.financas && (
                    <div className="p-4 bg-bg-main rounded-xl border border-border-subtle">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={18} className="text-yellow-400" />
                        <h4 className="font-bold text-white">Finanças</h4>
                      </div>
                      <p className="text-sm text-text-sec">{selectedReport.sugestoesAreas.financas}</p>
                    </div>
                  )}
                  {selectedReport.sugestoesAreas.educacao && (
                    <div className="p-4 bg-bg-main rounded-xl border border-border-subtle">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={18} className="text-purple-400" />
                        <h4 className="font-bold text-white">Educação</h4>
                      </div>
                      <p className="text-sm text-text-sec">{selectedReport.sugestoesAreas.educacao}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Foco da Próxima Semana */}
              <div className="p-6 bg-gradient-to-r from-accent-blue/20 to-accent-purple/20 rounded-2xl border border-accent-blue/30 text-center">
                <h3 className="text-lg text-text-sec mb-2">Foco Sugerido para a Próxima Semana</h3>
                <p className="text-2xl font-bold text-white">{selectedReport.focoProximaSemana}</p>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Star(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
