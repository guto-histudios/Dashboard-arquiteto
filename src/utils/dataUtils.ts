import { format, isAfter, isBefore, startOfDay, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export function getDataBrasil(): Date {
  return toZonedTime(new Date(), 'America/Sao_Paulo');
}

export function getDataStringBrasil(date: Date = new Date()): string {
  return format(toZonedTime(date, 'America/Sao_Paulo'), 'yyyy-MM-dd');
}

export function isDataFutura(dataTask: string): boolean {
  const hoje = startOfDay(getDataBrasil());
  const task = startOfDay(parseISO(dataTask));
  return isAfter(task, hoje);
}

export function isDataPassada(dataTask: string): boolean {
  const hoje = startOfDay(getDataBrasil());
  const task = startOfDay(parseISO(dataTask));
  return isBefore(task, hoje);
}

export function formatarData(data: string, formato: string = 'dd/MM/yyyy'): string {
  return format(parseISO(data), formato);
}

export function deveMostrarTask(task: any, dataAtualStr: string): boolean {
  if (task.tipoRepeticao === 'diasSemana' && task.diasSemana && task.diasSemana.length > 0) {
    const diaSemana = parseISO(dataAtualStr).getDay();
    return task.diasSemana.includes(diaSemana);
  }
  return true;
}
