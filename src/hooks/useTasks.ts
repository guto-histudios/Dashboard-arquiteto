import { useState, useEffect } from 'react';
import { Task, TaskStatus, TipoRepeticao } from '../types';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';
import { getDataStringBrasil, isDataFutura } from '../utils/dataUtils';
import { addDays, addWeeks, addMonths, parseISO, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

function calculateNextDate(currentDateStr: string, tipoRepeticao: TipoRepeticao, diasSemana?: number[]): string {
  const currentDate = parseISO(currentDateStr);
  let nextDate = currentDate;

  if (tipoRepeticao === 'diaria') {
    nextDate = addDays(currentDate, 1);
  } else if (tipoRepeticao === 'semanal') {
    nextDate = addWeeks(currentDate, 1);
  } else if (tipoRepeticao === 'mensal') {
    nextDate = addMonths(currentDate, 1);
  } else if (tipoRepeticao === 'diasSemana' && diasSemana && diasSemana.length > 0) {
    for (let i = 1; i <= 7; i++) {
      const testDate = addDays(currentDate, i);
      if (diasSemana.includes(testDate.getDay())) {
        nextDate = testDate;
        break;
      }
    }
  } else {
    nextDate = addDays(currentDate, 1);
  }

  return format(nextDate, 'yyyy-MM-dd');
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const salvos = getStorageItem<Task[]>('tasks', []);
    const hoje = getDataStringBrasil();
    const ultimoAcessoTasks = getStorageItem<string>('ultimoAcessoTasks', hoje);

    let tasksParaSalvar = [...salvos];

    if (ultimoAcessoTasks !== hoje) {
      const novasTasks: Task[] = [];
      
      tasksParaSalvar = tasksParaSalvar.map(task => {
        if (task.concluidaDefinitivamente) return task;
        
        if (task.status === 'adiada' && task.data <= hoje) {
           return { ...task, status: 'nao_iniciada' };
        }

        if (task.data < hoje && task.status !== 'concluida' && task.status !== 'cancelada') {
           if (task.tipoRepeticao !== 'nenhuma') {
             return { ...task, data: hoje, status: 'nao_iniciada' };
           }
        }

        return task;
      }).filter((task): task is Task => task.status !== 'cancelada');
      
      const tasksRecorrentes = tasksParaSalvar.filter(t => t.tipoRepeticao !== 'nenhuma' && !t.concluidaDefinitivamente);
      
      tasksRecorrentes.forEach(task => {
        if (task.status === 'concluida') {
          let nextDate = calculateNextDate(task.data, task.tipoRepeticao, task.diasSemana);
          
          while (nextDate < hoje) {
             nextDate = calculateNextDate(nextDate, task.tipoRepeticao, task.diasSemana);
          }
          
          const existingIndex = tasksParaSalvar.findIndex(t => t.titulo === task.titulo && t.data === nextDate && t.tipoRepeticao === task.tipoRepeticao);
          const existingNewIndex = novasTasks.findIndex(t => t.titulo === task.titulo && t.data === nextDate && t.tipoRepeticao === task.tipoRepeticao);
                         
          if (existingIndex === -1 && existingNewIndex === -1) {
            novasTasks.push({
              ...task,
              id: uuidv4(),
              status: 'nao_iniciada',
              data: nextDate,
              xpGanho: false,
              concluidaDefinitivamente: false,
              dataConclusaoDefinitiva: undefined
            });
          } else if (existingIndex !== -1) {
            tasksParaSalvar[existingIndex].vezesConcluida = task.vezesConcluida;
          } else if (existingNewIndex !== -1) {
            novasTasks[existingNewIndex].vezesConcluida = task.vezesConcluida;
          }
        }
      });
      
      tasksParaSalvar = [...tasksParaSalvar, ...novasTasks];
      setStorageItem('ultimoAcessoTasks', hoje);
    }

    setTasks(tasksParaSalvar);
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (!carregando) {
      setStorageItem('tasks', tasks);
    }
  }, [tasks, carregando]);

  const adicionarTask = (novaTask: Task): boolean => {
    const taskAlreadyExists = () => {
      return tasks.some(t => 
        t.titulo === novaTask.titulo && 
        t.data === novaTask.data && 
        t.horarioInicio === novaTask.horarioInicio
      );
    };

    if (taskAlreadyExists()) {
      console.warn('Task already exists, skipping creation.');
      return false;
    }

    const findNextFreeSlot = (task: Task): string | null => {
      if (!task.horarioInicio || !task.duracao) return null;
      
      let [h, m] = task.horarioInicio.split(':').map(Number);
      let startMins = h * 60 + m;
      
      while (startMins + task.duracao <= 24 * 60) {
        const endMins = startMins + task.duracao;
        
        const hasConflict = tasks.some(t => {
          if (t.status === 'cancelada' || t.status === 'concluida' || t.data !== task.data || !t.horarioInicio || !t.duracao) return false;
          
          const [th, tm] = t.horarioInicio.split(':').map(Number);
          const tStartMins = th * 60 + tm;
          const tEndMins = tStartMins + t.duracao;
          
          return (startMins < tEndMins && endMins > tStartMins);
        });
        
        if (!hasConflict) {
          const resH = Math.floor(startMins / 60);
          const resM = startMins % 60;
          return `${String(resH).padStart(2, '0')}:${String(resM).padStart(2, '0')}`;
        }
        
        startMins += 15;
      }
      return null;
    };

    if (novaTask.horarioInicio && novaTask.duracao) {
      const nextFreeSlot = findNextFreeSlot(novaTask);
      if (nextFreeSlot && nextFreeSlot !== novaTask.horarioInicio) {
        novaTask.horarioInicio = nextFreeSlot;
        if (novaTask.horarioFim) {
           const [h, m] = nextFreeSlot.split(':').map(Number);
           const endMins = h * 60 + m + novaTask.duracao;
           novaTask.horarioFim = `${String(Math.floor(endMins / 60) % 24).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
        }
        alert(`Conflito de horário resolvido: a tarefa "${novaTask.titulo}" foi movida para ${nextFreeSlot}.`);
      } else if (!nextFreeSlot && findNextFreeSlot(novaTask) === null) {
        // If it returned null because of no free slots (and not because missing horarioInicio/duracao)
        const hasConflict = tasks.some(t => {
          if (t.status === 'cancelada' || t.status === 'concluida' || t.data !== novaTask.data || !t.horarioInicio || !t.duracao) return false;
          const [th, tm] = t.horarioInicio.split(':').map(Number);
          const tStartMins = th * 60 + tm;
          const tEndMins = tStartMins + t.duracao;
          const [nh, nm] = novaTask.horarioInicio!.split(':').map(Number);
          const startMins = nh * 60 + nm;
          const endMins = startMins + novaTask.duracao;
          return (startMins < tEndMins && endMins > tStartMins);
        });
        if (hasConflict) {
          alert(`Conflito de horário: a tarefa "${novaTask.titulo}" não pôde ser criada porque não há horários livres.`);
          return false;
        }
      }
    }

    setTasks(prev => [...prev, novaTask]);
    return true;
  };

  const atualizarTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const removerTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const adiarTask = (id: string, novaData: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;

      const vezesAdiada = (t.vezesAdiada || 0) + 1;
      
      if (vezesAdiada > 3) {
        return { ...t, status: 'atrasada', vezesAdiada, data: novaData };
      }

      return { 
        ...t, 
        status: 'adiada', 
        data: novaData, 
        vezesAdiada 
      };
    }));
  };

  const mudarStatus = (id: string, novoStatus: TaskStatus, onConcluir?: (task: Task) => void, kpiAtingido?: boolean) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (novoStatus === 'concluida' && isDataFutura(task.data)) {
      alert('Data inválida: não é possível concluir itens de datas futuras');
      return;
    }

    setTasks(prev => {
      const newTasks = [...prev];
      const taskIndex = newTasks.findIndex(t => t.id === id);
      if (taskIndex === -1) return prev;

      const t = newTasks[taskIndex];
      const xpGanho = novoStatus === 'concluida' ? true : t.xpGanho;
      
      newTasks[taskIndex] = { ...t, status: novoStatus, xpGanho };

      if (novoStatus === 'concluida') {
        if (t.tipoRepeticao !== 'nenhuma') {
          newTasks[taskIndex].vezesConcluida = (t.vezesConcluida || 0) + 1;
          
          if (t.tipoConclusao === 'porKPI' && kpiAtingido) {
            newTasks[taskIndex].concluidaDefinitivamente = true;
            newTasks[taskIndex].dataConclusaoDefinitiva = getDataStringBrasil();
          } else {
            const nextDate = calculateNextDate(t.data, t.tipoRepeticao, t.diasSemana);
            const existingIndex = newTasks.findIndex(existing => existing.titulo === t.titulo && existing.data === nextDate && existing.tipoRepeticao === t.tipoRepeticao);
            
            if (existingIndex === -1) {
              newTasks.push({
                ...t,
                id: uuidv4(),
                status: 'nao_iniciada',
                data: nextDate,
                xpGanho: false,
                vezesConcluida: newTasks[taskIndex].vezesConcluida,
                concluidaDefinitivamente: false,
                dataConclusaoDefinitiva: undefined
              });
            } else {
              newTasks[existingIndex].vezesConcluida = newTasks[taskIndex].vezesConcluida;
            }
          }
        } else if (t.deadline) {
          newTasks[taskIndex].concluidaDefinitivamente = true;
          newTasks[taskIndex].dataConclusaoDefinitiva = getDataStringBrasil();
        }
      }

      return newTasks;
    });

    if (novoStatus === 'concluida' && onConcluir) {
       onConcluir(task);
    }
  };

  return { tasks, setTasks, carregando, adicionarTask, atualizarTask, removerTask, mudarStatus, adiarTask };
}
