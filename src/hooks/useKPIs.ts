import { useState, useEffect } from 'react';
import { KPI } from '../types';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';
import { getDataStringBrasil } from '../utils/dataUtils';

export function useKPIs() {
  const [kpis, setKPIs] = useState<KPI[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const salvos = getStorageItem<KPI[]>('kpis', []);
    setKPIs(salvos);
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (!carregando) {
      setStorageItem('kpis', kpis);
    }
  }, [kpis, carregando]);

  const adicionarKPI = (novoKPI: KPI) => {
    const kpiComHistorico = {
      ...novoKPI,
      historico: novoKPI.historico || [{ data: getDataStringBrasil(), valor: novoKPI.valorAtual }]
    };
    setKPIs(prev => [...prev, kpiComHistorico]);
  };

  const atualizarKPI = (id: string, novoValor: number) => {
    const hoje = getDataStringBrasil();
    
    setKPIs(prev => prev.map(k => {
      if (k.id === id) {
        const historicoAtual = [...(k.historico || [])];
        const ultimoRegistro = historicoAtual[historicoAtual.length - 1];

        if (ultimoRegistro && ultimoRegistro.data === hoje) {
          historicoAtual[historicoAtual.length - 1] = { data: hoje, valor: novoValor };
        } else {
          historicoAtual.push({ data: hoje, valor: novoValor });
        }

        return { ...k, valorAtual: novoValor, historico: historicoAtual };
      }
      return k;
    }));
  };

  const editarKPI = (kpiAtualizado: KPI) => {
    setKPIs(prev => prev.map(k => k.id === kpiAtualizado.id ? kpiAtualizado : k));
  };

  const removerKPI = (id: string) => {
    setKPIs(prev => prev.filter(k => k.id !== id));
  };

  return { kpis, setKPIs, carregando, adicionarKPI, atualizarKPI, editarKPI, removerKPI };
}
