export function getDataBrasil(): Date {
  return new Date();
}

export function getDataStringBrasil(date: Date = new Date()): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  const hoje = `${ano}-${mes}-${dia}`;
  
  console.log('[Debug Data] Data atual gerada:', hoje, 'Data original:', date.toString());
  return hoje;
}

export function isDataFutura(dataTask: string): boolean {
  const hoje = getDataStringBrasil();
  return dataTask > hoje;
}

export function isDataPassada(dataTask: string): boolean {
  const hoje = getDataStringBrasil();
  return dataTask < hoje;
}

export function formatarData(data: string, formato: string = 'dd/MM/yyyy'): string {
  if (!data) return '';
  const [ano, mes, dia] = data.split('-');
  if (formato === 'dd/MM/yyyy') {
    return `${dia}/${mes}/${ano}`;
  }
  return data;
}

export function deveMostrarTask(task: any, dataAtualStr: string): boolean {
  if (task.dataInicio && dataAtualStr < task.dataInicio) return false;
  if (task.dataFim && dataAtualStr > task.dataFim) return false;

  if (task.tipoRepeticao === 'diasSemana' && task.diasSemana && task.diasSemana.length > 0) {
    // Pegar o dia da semana da dataAtualStr
    const [ano, mes, dia] = dataAtualStr.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    const diaSemana = dataObj.getDay();
    return task.diasSemana.includes(diaSemana);
  }
  return true;
}
