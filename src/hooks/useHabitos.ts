import { useState, useEffect } from 'react';
import { Habito, ConclusaoHabito } from '../types';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';
import { getDataStringBrasil, isDataFutura } from '../utils/dataUtils';
import { subDays, parseISO } from 'date-fns';

function calculateStreak(conclusoes: ConclusaoHabito[]): number {
  const hoje = getDataStringBrasil();
  const ontem = getDataStringBrasil(subDays(new Date(), 1));
  
  // Sort by date descending
  const sorted = [...conclusoes]
    .filter(c => c.concluido)
    .sort((a, b) => b.data.localeCompare(a.data));
    
  if (sorted.length === 0) return 0;
  
  let streak = 0;
  let checkDate = new Date();
  
  // Check if completed today
  const doneToday = sorted.some(c => c.data === hoje);
  
  // If not done today, check if done yesterday to maintain streak
  if (!doneToday) {
    const doneYesterday = sorted.some(c => c.data === ontem);
    if (!doneYesterday) {
      return 0;
    }
    checkDate = subDays(checkDate, 1);
  }
  
  // Count backwards
  while (true) {
    const dateStr = getDataStringBrasil(checkDate);
    const isDone = sorted.some(c => c.data === dateStr);
    
    if (isDone) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }
  
  return streak;
}

export function useHabitos() {
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const salvos = getStorageItem<Habito[]>('habitos', []);
    
    // Recalculate streaks on load to ensure consistency
    const habitosAtualizados = salvos.map(h => ({
      ...h,
      streak: calculateStreak(h.conclusoes || [])
    }));
    
    setHabitos(habitosAtualizados);
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (!carregando) {
      setStorageItem('habitos', habitos);
    }
  }, [habitos, carregando]);

  const adicionarHabito = (novoHabito: Habito) => {
    setHabitos(prev => [...prev, { ...novoHabito, streak: 0 }]);
  };

  const atualizarHabito = (id: string, updates: Partial<Habito>) => {
    setHabitos(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const removerHabito = (id: string) => {
    setHabitos(prev => prev.filter(h => h.id !== id));
  };

  const toggleConclusao = (id: string, data: string, onConcluir?: (habito: Habito) => void) => {
    if (isDataFutura(data)) {
      alert('Data inválida: não é possível concluir itens de datas futuras');
      return;
    }

    setHabitos(prev => prev.map(h => {
      if (h.id === id) {
        const conclusoes = [...h.conclusoes];
        const index = conclusoes.findIndex(c => c.data === data);
        let foiConcluido = false;
        
        if (index >= 0) {
          conclusoes[index].concluido = !conclusoes[index].concluido;
          foiConcluido = conclusoes[index].concluido;
        } else {
          conclusoes.push({ data, concluido: true });
          foiConcluido = true;
        }
        
        const newStreak = calculateStreak(conclusoes);
        
        const updatedHabito = { 
          ...h, 
          conclusoes, 
          streak: newStreak,
          ultimoCumprimento: newStreak > 0 ? data : h.ultimoCumprimento 
        };

        if (foiConcluido && onConcluir) {
            // We need to call this after state update ideally, but here we are inside map.
            // We can't call side effects inside map easily without being careful.
            // But since onConcluir is likely just adding coins, it might be fine if we are careful.
            // Actually, better to do it outside.
        }
        return updatedHabito;
      }
      return h;
    }));
    
    // We need to find the habit and check if it was completed to call the callback.
    // This is a bit tricky with the current structure.
    // Let's do a separate find.
    const habito = habitos.find(h => h.id === id);
    if (habito) {
        // Check if it is being completed or uncompleted.
        const conclusao = habito.conclusoes.find(c => c.data === data);
        const isCompleted = conclusao ? !conclusao.concluido : true; // If not found, it will be added as true.
        
        if (isCompleted && onConcluir) {
            onConcluir(habito);
        }
    }
  };

  const calcularProgressoHabitos = (data: string): number => {
    const habitosDoDia = habitos.filter(h => {
      const diaSemana = new Date(data).getDay();
      return h.diasSemana.includes(diaSemana);
    });
    
    if (habitosDoDia.length === 0) return 0;
    
    const concluidos = habitosDoDia.filter(h => {
      const conclusao = h.conclusoes.find(c => c.data === data);
      return conclusao?.concluido;
    });
    
    return (concluidos.length / habitosDoDia.length) * 100;
  };

  return { habitos, setHabitos, carregando, adicionarHabito, atualizarHabito, removerHabito, toggleConclusao, calcularProgressoHabitos };
}
