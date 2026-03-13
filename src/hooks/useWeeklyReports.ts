import { useState, useEffect } from 'react';
import { WeeklyReport, Task, Habito, Meta, GamificationState } from '../types';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';
import { getDataStringBrasil } from '../utils/dataUtils';
import { subDays, isAfter, isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export function useWeeklyReports() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const salvos = getStorageItem<WeeklyReport[]>('weeklyReports', []);
    setReports(salvos);
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (!carregando) {
      setStorageItem('weeklyReports', reports);
    }
  }, [reports, carregando]);

  const generateReport = (
    tasks: Task[],
    habitos: Habito[],
    metas: Meta[],
    gamification: GamificationState,
    nivelAtual: number
  ): WeeklyReport => {
    const hoje = parseISO(getDataStringBrasil());
    const dataFim = getDataStringBrasil();
    const dataInicio = getDataStringBrasil(subDays(hoje, 6)); // Últimos 7 dias

    const start = startOfDay(parseISO(dataInicio));
    const end = endOfDay(hoje);

    // 1. Tasks
    const tasksDaSemana = tasks.filter(t => {
      const taskDate = parseISO(t.data);
      return (isAfter(taskDate, start) || taskDate.getTime() === start.getTime()) && 
             (isBefore(taskDate, end) || taskDate.getTime() === end.getTime());
    });

    const tasksPlanejadas = tasksDaSemana.length;
    const tasksConcluidas = tasksDaSemana.filter(t => t.status === 'concluida').length;
    const pendenciasTasks = tasksDaSemana
      .filter(t => t.status !== 'concluida' && t.status !== 'cancelada')
      .map(t => t.titulo);

    const pomodorosCompletados = tasksDaSemana.reduce((acc, t) => acc + (t.pomodorosFeitos || 0), 0);

    // 2. Habitos
    let habitosPlanejados = 0;
    let habitosConcluidos = 0;

    habitos.forEach(h => {
      // Para cada dia da semana, verificar se o hábito estava programado
      for (let i = 0; i < 7; i++) {
        const dia = subDays(hoje, i);
        const diaSemana = dia.getDay();
        const dataStr = getDataStringBrasil(dia);
        
        if (h.diasSemana.includes(diaSemana)) {
          habitosPlanejados++;
          const conclusao = h.conclusoes.find(c => c.data === dataStr);
          if (conclusao?.concluido) {
            habitosConcluidos++;
          }
        }
      }
    });

    // 3. Metas
    const metasAtivas = metas;
    const metasPlanejadas = metasAtivas.length;
    const metasAtingidas = metasAtivas.filter(m => m.status === 'concluida').length;
    const pendenciasMetas = metasAtivas
      .filter(m => m.status !== 'concluida')
      .map(m => m.titulo);

    // 4. Analise
    const pontosPositivos: string[] = [];
    const pontosMelhoria: string[] = [];
    
    const taxaTasks = tasksPlanejadas > 0 ? tasksConcluidas / tasksPlanejadas : 0;
    const taxaHabitos = habitosPlanejados > 0 ? habitosConcluidos / habitosPlanejados : 0;

    if (taxaTasks >= 0.8) pontosPositivos.push('Excelente taxa de conclusão de tarefas!');
    else if (taxaTasks < 0.5) pontosMelhoria.push('Muitas tarefas ficaram pendentes. Tente planejar menos itens por dia.');

    if (taxaHabitos >= 0.8) pontosPositivos.push('Ótima consistência nos hábitos!');
    else if (taxaHabitos < 0.5) pontosMelhoria.push('A consistência dos hábitos caiu. Foque nos hábitos mais importantes.');

    if (pomodorosCompletados > 10) pontosPositivos.push('Bom uso de blocos de foco (Pomodoro).');
    else pontosMelhoria.push('Você poderia usar mais a técnica Pomodoro para manter o foco.');

    if (gamification.streakDias > 3) pontosPositivos.push(`Você manteve um streak de ${gamification.streakDias} dias!`);

    // 5. Descritivo
    const resumo = `Nesta semana você concluiu ${Math.round(taxaTasks * 100)}% das suas tarefas e manteve ${Math.round(taxaHabitos * 100)}% de consistência nos hábitos. ${taxaTasks >= 0.7 && taxaHabitos >= 0.7 ? 'Foi uma semana muito produtiva!' : 'Há espaço para melhorar sua organização na próxima semana.'}`;

    // 6. Sugestoes por area
    const sugestoesAreas = {
      carreira: 'Revise suas metas profissionais e defina 1 prioridade clara para a próxima semana.',
      saude: taxaHabitos < 0.6 ? 'Tente focar em apenas 1 hábito de saúde (ex: beber água) antes de adicionar outros.' : 'Mantenha o ritmo de exercícios e boa alimentação.',
      pessoal: 'Reserve pelo menos 2 horas no fim de semana para um hobby ou descanso.',
      financas: 'Revise seus gastos da semana e planeje o orçamento da próxima.',
      educacao: 'Dedique 30 minutos diários para leitura ou estudo de um novo tema.'
    };

    const newReport: WeeklyReport = {
      id: uuidv4(),
      dataInicio,
      dataFim,
      dataGeracao: getDataStringBrasil(),
      tasksConcluidas,
      tasksPlanejadas,
      habitosConcluidos,
      habitosPlanejados,
      metasAtingidas,
      metasPlanejadas,
      xpGanho: gamification.xpDiario, // Simplificado, ideal seria rastrear XP semanal
      pomodorosCompletados,
      streakAtual: gamification.streakDias,
      nivelAtual,
      pontosPositivos,
      pontosMelhoria,
      pendencias: [...pendenciasTasks.slice(0, 3), ...pendenciasMetas.slice(0, 2)],
      resumo,
      sugestoesAreas,
      focoProximaSemana: 'Organização e Consistência'
    };

    setReports(prev => {
      const updated = [newReport, ...prev];
      // Manter apenas os ultimos 4 relatorios
      return updated.slice(0, 4);
    });

    return newReport;
  };

  const deleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  };

  return {
    reports,
    generateReport,
    deleteReport,
    carregando
  };
}
