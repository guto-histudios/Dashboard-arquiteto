import { useState, useEffect } from 'react';
import { PlanoTrimestral } from '../types';
import { getDataStringBrasil } from '../utils/dataUtils';
import { addDays, isAfter, differenceInDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export function usePlanoTrimestral() {
  const [planoTrimestral, setPlanoTrimestral] = useState<PlanoTrimestral | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const salvo = localStorage.getItem('planoTrimestral');
    if (salvo) {
      try {
        const parsed = JSON.parse(salvo);
        setPlanoTrimestral(parsed);
      } catch (e) {
        console.error("Erro ao carregar plano trimestral", e);
      }
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (!carregando) {
      if (planoTrimestral) {
        localStorage.setItem('planoTrimestral', JSON.stringify(planoTrimestral));
      } else {
        localStorage.removeItem('planoTrimestral');
      }
    }
  }, [planoTrimestral, carregando]);

  const criarPlano = (objetivoPrincipal: string) => {
    const hoje = getDataStringBrasil();
    const dataFim = getDataStringBrasil(addDays(new Date(hoje), 90));
    
    const novoPlano: PlanoTrimestral = {
      id: uuidv4(),
      dataInicio: hoje,
      dataFim: dataFim,
      objetivoPrincipal,
      status: 'ativo',
      mesAtual: 1
    };
    
    setPlanoTrimestral(novoPlano);
    return novoPlano;
  };

  const atualizarPlano = (updates: Partial<PlanoTrimestral>) => {
    if (planoTrimestral) {
      setPlanoTrimestral({ ...planoTrimestral, ...updates });
    }
  };

  const verificarProgresso = () => {
    if (!planoTrimestral || planoTrimestral.status !== 'ativo') return;

    const hoje = getDataStringBrasil();
    const diasPassados = differenceInDays(new Date(hoje), new Date(planoTrimestral.dataInicio));
    
    let mesAtual = 1;
    if (diasPassados >= 60) mesAtual = 3;
    else if (diasPassados >= 30) mesAtual = 2;

    if (mesAtual !== planoTrimestral.mesAtual) {
      atualizarPlano({ mesAtual });
    }

    if (isAfter(new Date(hoje), new Date(planoTrimestral.dataFim))) {
      atualizarPlano({ status: 'revisando' });
    }
  };

  useEffect(() => {
    if (!carregando) {
      verificarProgresso();
    }
  }, [carregando]);

  return { planoTrimestral, setPlanoTrimestral, criarPlano, atualizarPlano };
}
