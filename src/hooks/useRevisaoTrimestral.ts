import { useState, useEffect } from 'react';
import { QuarterlyReport, Meta, KPI, Task, GamificationState, Habito } from '../types';
import { getDataStringBrasil } from '../utils/dataUtils';
import { v4 as uuidv4 } from 'uuid';

export function useRevisaoTrimestral() {
  const [reports, setReports] = useState<QuarterlyReport[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const salvo = localStorage.getItem('quarterlyReports');
    if (salvo) {
      setReports(JSON.parse(salvo));
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (!carregando) {
      localStorage.setItem('quarterlyReports', JSON.stringify(reports));
    }
  }, [reports, carregando]);

  const gerarRelatorio = (
    metas: Meta[],
    kpis: KPI[],
    tasks: Task[],
    gamification: GamificationState,
    habitos: Habito[]
  ): QuarterlyReport => {
    const hoje = getDataStringBrasil();
    
    const metasConcluidas = metas.filter(m => m.status === 'concluida').length;
    const kpisAtingidos = kpis.filter(k => k.valorAtual >= k.valorMeta).length;
    const tasksFeitas = tasks.filter(t => t.status === 'concluida').length;
    const tasksPendentes = tasks.filter(t => t.status !== 'concluida').length;

    const novoRelatorio: QuarterlyReport = {
      id: uuidv4(),
      dataInicio: '2026-01-01', // Placeholder, should be calculated
      dataFim: hoje,
      dataGeracao: hoje,
      metasConcluidas,
      metasPlanejadas: metas.length,
      kpisAtingidos,
      kpisPlanejados: kpis.length,
      tasksFeitas,
      tasksPendentes,
      xpGanho: gamification.totalXP,
      streakHabitos: gamification.streakDias,
      oQueFoiBem: ['Conclusão de metas importantes', 'Consistência nos hábitos'],
      oQueMelhorar: ['Foco em tarefas de alta prioridade', 'Gestão de tempo'],
      sugestoesProximoTrimestre: ['Aumentar meta de vídeos', 'Focar em estudos'],
      resumo: `Nos últimos 3 meses você concluiu ${metasConcluidas} metas e atingiu ${kpisAtingidos} KPIs.`
    };

    setReports(prev => [...prev, novoRelatorio]);
    return novoRelatorio;
  };

  return { reports, gerarRelatorio, carregando };
}
