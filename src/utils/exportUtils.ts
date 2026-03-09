import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task, Habito, Meta, KPI, GamificationState } from '../types';

interface ExportData {
  tasks: Task[];
  habitos: Habito[];
  metas: Meta[];
  kpis: KPI[];
  gamification: GamificationState;
  levelInfo: { nivel: number; xpAtualNoNivel: number; xpParaProximoNivel: number; progressoPercentual: number };
}

type Period = 'diario' | 'semanal' | 'mensal';

export const generatePDFReport = (data: ExportData, period: Period) => {
  const doc = new jsPDF();
  const today = new Date();
  
  let startDate: Date;
  let endDate: Date;
  let title: string;

  switch (period) {
    case 'diario':
      startDate = today;
      endDate = today;
      title = `Relatório Diário - ${format(today, 'dd/MM/yyyy')}`;
      break;
    case 'semanal':
      startDate = startOfWeek(today, { weekStartsOn: 0 });
      endDate = endOfWeek(today, { weekStartsOn: 0 });
      title = `Relatório Semanal - ${format(startDate, 'dd/MM')} a ${format(endDate, 'dd/MM/yyyy')}`;
      break;
    case 'mensal':
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
      title = `Relatório Mensal - ${format(today, 'MMMM yyyy', { locale: ptBR })}`;
      break;
  }

  // Helper to check if a date string is within the period
  const isDateInPeriod = (dateStr: string) => {
    const date = new Date(dateStr);
    // For daily, just compare the date string directly to avoid timezone issues
    if (period === 'diario') {
      return dateStr === format(today, 'yyyy-MM-dd');
    }
    return isWithinInterval(date, { start: startDate, end: endDate });
  };

  // Filter data
  const completedTasks = data.tasks.filter(t => t.status === 'concluida' && isDateInPeriod(t.data));
  
  const completedHabits = data.habitos.map(h => {
    const conclusoesNoPeriodo = h.conclusoes.filter(c => c.concluido && isDateInPeriod(c.data));
    return {
      nome: h.nome,
      total: conclusoesNoPeriodo.length
    };
  }).filter(h => h.total > 0);

  const completedMetas = data.metas.filter(m => m.status === 'concluida' && isDateInPeriod(m.dataFim));

  // --- PDF Generation ---
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(139, 92, 246); // accent-purple
  doc.text('O Arquiteto', 14, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text(title, 14, 30);
  
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 36);

  let yPos = 45;

  // Gamification Summary
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Resumo do Perfil', 14, yPos);
  yPos += 10;
  
  doc.setFontSize(12);
  doc.setTextColor(60);
  doc.text(`Nível Atual: ${data.levelInfo.nivel}`, 14, yPos);
  doc.text(`XP Total: ${data.gamification.totalXP}`, 80, yPos);
  doc.text(`Ofensiva: ${data.gamification.streakDias} dias`, 140, yPos);
  yPos += 15;

  // Tasks
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(`Tarefas Concluídas (${completedTasks.length})`, 14, yPos);
  yPos += 5;

  if (completedTasks.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Tarefa', 'Categoria', 'Data', 'Foco (min)']],
      body: completedTasks.map(t => [
        t.titulo, 
        t.categoria, 
        format(new Date(t.data), 'dd/MM/yyyy'),
        (t.pomodorosFeitos || 0) * 25 // Assuming 25min per pomodoro for simplicity here, or we could pass config
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }, // accent-blue
      margin: { top: 10 }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Nenhuma tarefa concluída neste período.', 14, yPos + 5);
    yPos += 15;
  }

  // Habits
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Hábitos Cumpridos', 14, yPos);
  yPos += 5;

  if (completedHabits.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Hábito', 'Vezes Concluído']],
      body: completedHabits.map(h => [h.nome, h.total.toString()]),
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] }, // success green
      margin: { top: 10 }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Nenhum hábito cumprido neste período.', 14, yPos + 5);
    yPos += 15;
  }

  // Check page break
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // Metas
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(`Metas Atingidas (${completedMetas.length})`, 14, yPos);
  yPos += 5;

  if (completedMetas.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Meta', 'Período', 'Data Fim']],
      body: completedMetas.map(m => [
        m.titulo, 
        m.periodo, 
        format(new Date(m.dataFim), 'dd/MM/yyyy')
      ]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] }, // accent-purple
      margin: { top: 10 }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Nenhuma meta atingida neste período.', 14, yPos + 5);
    yPos += 15;
  }

  // KPIs
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Status dos KPIs', 14, yPos);
  yPos += 5;

  if (data.kpis.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['KPI', 'Atual', 'Meta', 'Progresso']],
      body: data.kpis.map(k => {
        const progresso = Math.min(Math.round((k.valorAtual / k.valorMeta) * 100), 100);
        return [
          k.titulo, 
          `${k.valorAtual} ${k.unidade}`, 
          `${k.valorMeta} ${k.unidade}`,
          `${progresso}%`
        ];
      }),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] }, // warning orange
      margin: { top: 10 }
    });
  } else {
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Nenhum KPI definido.', 14, yPos + 5);
  }

  // Save the PDF
  doc.save(`o-arquiteto-relatorio-${period}-${format(today, 'yyyy-MM-dd')}.pdf`);
};

export const exportDataJSON = (data: any) => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `o-arquiteto-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};
