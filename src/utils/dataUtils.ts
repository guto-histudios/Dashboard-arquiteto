export function getDataBrasil(): Date {
  return new Date();
}

export function getDataStringBrasil(date: Date = new Date()): string {
  // Cuidado com timezone: getTimezoneOffset() retorna a diferença em minutos
  // Subtraindo o offset, ajustamos a data para que o toISOString() retorne a data local correta
  const offsetMs = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offsetMs);
  
  // Converter datas para formato: "YYYY-MM-DD"
  const hoje = localDate.toISOString().split('T')[0];
  
  console.log('[Debug Data] Data atual gerada:', hoje, 'Data original:', date.toDateString());
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
