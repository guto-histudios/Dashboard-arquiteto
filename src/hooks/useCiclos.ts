import { useState, useEffect } from 'react';
import { Ciclo } from '../types';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';

export function useCiclos() {
  const [ciclosConcluidos, setCiclosConcluidos] = useState<Ciclo[]>([]);

  useEffect(() => {
    setCiclosConcluidos(getStorageItem<Ciclo[]>('ciclos', []));
  }, []);

  const salvarCiclo = (ciclo: Ciclo) => {
    const novosCiclos = [...ciclosConcluidos, ciclo];
    setCiclosConcluidos(novosCiclos);
    setStorageItem('ciclos', novosCiclos);
  };

  return { ciclosConcluidos, salvarCiclo };
}
