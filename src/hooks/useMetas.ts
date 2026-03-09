import { useState, useEffect } from 'react';
import { Meta, MetaPeriodo } from '../types';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';
import { getDataStringBrasil } from '../utils/dataUtils';
import { addDays, isAfter, parseISO, format } from 'date-fns';

export function useMetas() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Helper para gerar título Kaizen
  const gerarTituloKaizen = (titulo: string): string => {
    const regex = /(\d+)/g;
    const novoTitulo = titulo.replace(regex, (match) => {
      const num = parseInt(match);
      const novoNum = Math.ceil(num * 1.15); // +15%
      return novoNum.toString();
    });
    
    if (novoTitulo === titulo) {
      return `${titulo} (Nível 2)`;
    }
    return novoTitulo;
  };

  useEffect(() => {
    const salvos = getStorageItem<Meta[]>('metas', []);
    const hoje = getDataStringBrasil();
    let houveMudanca = false;
    const novasMetas: Meta[] = [];

    const metasProcessadas = salvos.map(meta => {
      if (meta.arquivada) return meta;

      // Calcular deadline se não existir (retrocompatibilidade)
      if (!meta.deadline) {
        const dias = meta.periodo === 'semanal' ? 7 : meta.periodo === 'mensal' ? 30 : 90;
        meta.deadline = format(addDays(parseISO(meta.dataInicio), dias), 'yyyy-MM-dd');
        houveMudanca = true;
      }

      // Verificar arquivamento (hoje > deadline)
      if (isAfter(parseISO(hoje), parseISO(meta.deadline))) {
        const resultado = meta.status === 'concluida' ? 'sucesso' : 'falha';
        const novaMeta = { ...meta, arquivada: true, resultado } as Meta;
        
        // Gerar Kaizen se sucesso e semanal
        if (resultado === 'sucesso' && meta.periodo === 'semanal') {
          const tituloNovo = gerarTituloKaizen(meta.titulo);
          const novaMetaKaizen: Meta = {
            id: crypto.randomUUID(),
            titulo: tituloNovo,
            descricao: `Kaizen: Evolução de "${meta.titulo}" (+10-20%)`,
            periodo: 'semanal',
            dataInicio: hoje,
            dataFim: format(addDays(parseISO(hoje), 7), 'yyyy-MM-dd'),
            deadline: format(addDays(parseISO(hoje), 7), 'yyyy-MM-dd'),
            progresso: 0,
            status: 'nao_iniciada',
            tasksVinculadas: [],
            ehIkigai: meta.ehIkigai,
            ehShokunin: meta.ehShokunin
          };
          novasMetas.push(novaMetaKaizen);
        }
        
        houveMudanca = true;
        return novaMeta;
      }
      
      return meta;
    });

    if (houveMudanca) {
      setMetas([...metasProcessadas, ...novasMetas]);
    } else {
      setMetas(salvos);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (!carregando) {
      setStorageItem('metas', metas);
    }
  }, [metas, carregando]);

  const adicionarMeta = (novaMeta: Meta) => {
    // Calcular deadline ao criar
    const dias = novaMeta.periodo === 'semanal' ? 7 : novaMeta.periodo === 'mensal' ? 30 : 90;
    const deadline = format(addDays(parseISO(novaMeta.dataInicio), dias), 'yyyy-MM-dd');
    
    setMetas(prev => [...prev, { ...novaMeta, deadline }]);
  };

  const atualizarMeta = (id: string, updates: Partial<Meta>, onConcluir?: (meta: Meta) => void) => {
    setMetas(prev => prev.map(m => {
      if (m.id === id) {
        const atualizada = { ...m, ...updates };
        
        // Se concluiu, registrar data
        if (updates.status === 'concluida' && m.status !== 'concluida') {
          atualizada.dataConclusao = getDataStringBrasil();
          if (onConcluir) {
              // Call callback (side effect inside map, but safe here as it's just triggering an event)
              // Ideally use useEffect or a separate event, but for this simple case it works.
              // To be safer, we can wrap in setTimeout to push to next tick.
              setTimeout(() => onConcluir(atualizada), 0);
          }
        }
        
        return atualizada;
      }
      return m;
    }));
  };

  const removerMeta = (id: string) => {
    setMetas(prev => prev.filter(m => m.id !== id));
  };

  return { metas, setMetas, carregando, adicionarMeta, atualizarMeta, removerMeta };
}
