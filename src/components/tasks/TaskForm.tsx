import React, { useState, useMemo } from 'react';
import { Task, TaskCategoria, TaskPrioridade, TipoRepeticao } from '../../types';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getDataStringBrasil } from '../../utils/dataUtils';
import { useApp } from '../../contexts/AppContext';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  initialTask?: Task;
}

export function TaskForm({ isOpen, onClose, onSave, initialTask }: TaskFormProps) {
  const { horariosFixos, kpis, metas, adicionarHorarioFixo } = useApp();
  const [titulo, setTitulo] = useState(initialTask?.titulo || '');
  const [descricao, setDescricao] = useState(initialTask?.descricao || '');
  const [duracao, setDuracao] = useState(initialTask?.duracao || 30);
  const [horario, setHorario] = useState(initialTask?.horario || '');
  const [categoria, setCategoria] = useState<TaskCategoria>(initialTask?.categoria || 'trabalho');
  const [prioridade, setPrioridade] = useState<TaskPrioridade>(initialTask?.prioridade || 'media');
  const [data, setData] = useState(initialTask?.data || getDataStringBrasil());
  const [tipoRepeticao, setTipoRepeticao] = useState<TipoRepeticao>(initialTask?.tipoRepeticao || 'nenhuma');
  const [diasSemana, setDiasSemana] = useState<number[]>(initialTask?.diasSemana || []);
  const [horarioFixo, setHorarioFixo] = useState(initialTask?.horarioFixo || false);
  const [horarioFixoId, setHorarioFixoId] = useState(initialTask?.horarioFixoId || '');
  const [temDeadline, setTemDeadline] = useState(!!initialTask?.deadline);
  const [deadline, setDeadline] = useState(initialTask?.deadline || '');
  const [kpiVinculado, setKpiVinculado] = useState(initialTask?.kpiVinculado || '');
  const [metaVinculada, setMetaVinculada] = useState(initialTask?.metaVinculada || '');

  React.useEffect(() => {
    if (isOpen) {
      setTitulo(initialTask?.titulo || '');
      setDescricao(initialTask?.descricao || '');
      setDuracao(initialTask?.duracao || 30);
      setHorario(initialTask?.horario || '');
      setCategoria(initialTask?.categoria || 'trabalho');
      setPrioridade(initialTask?.prioridade || 'media');
      setData(initialTask?.data || getDataStringBrasil());
      setTipoRepeticao(initialTask?.tipoRepeticao || 'nenhuma');
      setDiasSemana(initialTask?.diasSemana || []);
      setHorarioFixo(initialTask?.horarioFixo || false);
      setHorarioFixoId(initialTask?.horarioFixoId || '');
      setTemDeadline(!!initialTask?.deadline);
      setDeadline(initialTask?.deadline || '');
      setKpiVinculado(initialTask?.kpiVinculado || '');
      setMetaVinculada(initialTask?.metaVinculada || '');
    }
  }, [isOpen, initialTask]);

  const handleHorarioFixoChange = (id: string) => {
    setHorarioFixoId(id);
    if (id) {
      const fixo = horariosFixos.find(h => h.id === id);
      if (fixo) {
        setHorario(fixo.horaInicio);
        setTitulo(fixo.descricao);
        if (fixo.horaFim) {
          const [h1, m1] = fixo.horaInicio.split(':').map(Number);
          const [h2, m2] = fixo.horaFim.split(':').map(Number);
          let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (diff < 0) diff += 24 * 60;
          setDuracao(diff);
        }
      }
    }
  };

  const horarioFim = useMemo(() => {
    if (!horario || !duracao) return null;
    const [h, m] = horario.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + duracao, 0, 0);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }, [horario, duracao]);

  const overlapWarning = useMemo(() => {
    if (!horario || !horarioFim || !horariosFixos.length) return null;
    
    const taskStart = parseInt(horario.replace(':', ''));
    const taskEnd = parseInt(horarioFim.replace(':', ''));

    for (const fixo of horariosFixos) {
      if (!fixo.horaInicio) continue;
      const fixoStart = parseInt(fixo.horaInicio.replace(':', ''));
      let fixoEnd = fixoStart + 60; // default 1h if no end time
      if (fixo.horaFim) {
        fixoEnd = parseInt(fixo.horaFim.replace(':', ''));
      }

      // Check overlap
      if (taskStart < fixoEnd && taskEnd > fixoStart) {
        return `Atenção: Este horário sobrepõe com seu horário fixo: ${fixo.descricao} (${fixo.horaInicio}${fixo.horaFim ? ` - ${fixo.horaFim}` : ''})`;
      }
    }
    return null;
  }, [horario, horarioFim, horariosFixos]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalHorarioFixoId = horarioFixoId;
    
    if (horarioFixo && !horarioFixoId && horario && titulo) {
      const newId = uuidv4();
      adicionarHorarioFixo({
        id: newId,
        tipo: 'outro',
        horaInicio: horario,
        horaFim: horarioFim || undefined,
        descricao: titulo
      });
      finalHorarioFixoId = newId;
    }

    const newTask: Task = {
      ...(initialTask || {}),
      id: initialTask?.id || uuidv4(),
      titulo,
      descricao,
      duracao,
      horario: horarioFixo && horario ? horario : undefined,
      horarioFixo,
      horarioFixoId: horarioFixo && finalHorarioFixoId ? finalHorarioFixoId : undefined,
      deadline: temDeadline && deadline ? deadline : undefined,
      categoria,
      prioridade,
      status: initialTask?.status || 'nao_iniciada',
      data,
      tipoRepeticao,
      diasSemana: tipoRepeticao === 'diasSemana' ? diasSemana : undefined,
      vezAtual: initialTask?.vezAtual || 1,
      vezesConcluida: initialTask?.vezesConcluida || 0,
      xpGanho: initialTask?.xpGanho || false,
      pomodorosFeitos: initialTask?.pomodorosFeitos || 0,
      kpiVinculado: kpiVinculado || undefined,
      metaVinculada: metaVinculada || undefined,
    };
    onSave(newTask);
    onClose();
    // Reset form
    setTitulo('');
    setDescricao('');
    setDuracao(30);
    setHorario('');
    setHorarioFixo(false);
    setHorarioFixoId('');
    setTemDeadline(false);
    setDeadline('');
    setDiasSemana([]);
    setKpiVinculado('');
    setMetaVinculada('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-border-subtle sticky top-0 bg-bg-card/95 backdrop-blur-sm z-10">
          <h2 className="text-xl font-bold tracking-tight">{initialTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button onClick={onClose} className="text-text-sec hover:text-white transition-colors p-2 hover:bg-bg-sec rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-sec">Título</label>
            <input 
              required
              value={titulo} 
              onChange={(e) => setTitulo(e.target.value)} 
              className="input-modern"
              placeholder="O que precisa ser feito?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-text-sec">Descrição</label>
            <textarea 
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)} 
              className="input-modern min-h-[80px] resize-y"
              placeholder="Detalhes adicionais..."
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-sec">Data</label>
              <input 
                type="date"
                required
                value={data} 
                onChange={(e) => setData(e.target.value)} 
                className="input-modern"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-text-sec">Duração (min)</label>
              <input 
                type="number"
                required
                min="1"
                value={duracao} 
                onChange={(e) => setDuracao(Number(e.target.value))} 
                className="input-modern"
              />
            </div>
          </div>

          <div className="space-y-4 bg-bg-sec/30 p-4 rounded-xl border border-border-subtle">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                Horário fixo?
              </label>
              <input 
                type="checkbox" 
                checked={horarioFixo}
                onChange={(e) => setHorarioFixo(e.target.checked)}
                className="w-4 h-4 rounded border-border-subtle bg-bg-main text-accent-blue focus:ring-accent-blue focus:ring-offset-bg-card"
              />
            </div>

            {horarioFixo && (
              <div className="space-y-4 pt-2">
                {horariosFixos.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-sec">Vincular a Horário Existente</label>
                    <select
                      value={horarioFixoId}
                      onChange={(e) => handleHorarioFixoChange(e.target.value)}
                      className="input-modern appearance-none"
                    >
                      <option value="">-- Criar novo horário personalizado --</option>
                      {horariosFixos.map(hf => (
                        <option key={hf.id} value={hf.id}>
                          {hf.descricao} ({hf.horaInicio}{hf.horaFim ? ` - ${hf.horaFim}` : ''})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-sec">Horário de Início</label>
                    <input 
                      type="time"
                      required={horarioFixo}
                      value={horario} 
                      onChange={(e) => {
                        setHorario(e.target.value);
                        setHorarioFixoId(''); // Desvincular se mudar manualmente
                      }} 
                      className="input-modern"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-sec">Horário de Fim</label>
                    <div className="input-modern bg-bg-main flex items-center text-text-sec">
                      <Clock size={16} className="mr-2" />
                      {horarioFim || '--:--'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 bg-bg-sec/30 p-4 rounded-xl border border-border-subtle">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                Tem deadline?
              </label>
              <input 
                type="checkbox" 
                checked={temDeadline}
                onChange={(e) => setTemDeadline(e.target.checked)}
                className="w-4 h-4 rounded border-border-subtle bg-bg-main text-accent-blue focus:ring-accent-blue focus:ring-offset-bg-card"
              />
            </div>

            {temDeadline && (
              <div className="pt-2">
                <label className="block text-sm font-medium mb-2 text-text-sec">Data Limite (Deadline)</label>
                <input 
                  type="date"
                  required={temDeadline}
                  value={deadline} 
                  onChange={(e) => setDeadline(e.target.value)} 
                  className="input-modern"
                />
              </div>
            )}
          </div>

          {overlapWarning && (
            <div className="bg-warning/10 border border-warning/30 text-warning p-3 rounded-lg flex items-start gap-2 text-sm">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <p>{overlapWarning}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-sec">Categoria</label>
              <select 
                value={categoria} 
                onChange={(e) => setCategoria(e.target.value as TaskCategoria)} 
                className="input-modern appearance-none"
              >
                <option value="trabalho">Trabalho</option>
                <option value="pessoal">Pessoal</option>
                <option value="saude">Saúde</option>
                <option value="estudos">Estudos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-text-sec">Prioridade</label>
              <select 
                value={prioridade} 
                onChange={(e) => setPrioridade(e.target.value as TaskPrioridade)} 
                className="input-modern appearance-none"
              >
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-text-sec">Repetição</label>
            <select 
              value={tipoRepeticao} 
              onChange={(e) => setTipoRepeticao(e.target.value as TipoRepeticao)} 
              className="input-modern appearance-none"
            >
              <option value="nenhuma">Nenhuma</option>
              <option value="diaria">Diária</option>
              <option value="diasSemana">Dias Específicos</option>
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>

          {tipoRepeticao === 'diasSemana' && (
            <div className="bg-bg-sec/30 p-4 rounded-xl border border-border-subtle">
              <label className="block text-sm font-medium mb-3 text-text-sec">Repetir nos dias:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 0, label: 'Dom' },
                  { id: 1, label: 'Seg' },
                  { id: 2, label: 'Ter' },
                  { id: 3, label: 'Qua' },
                  { id: 4, label: 'Qui' },
                  { id: 5, label: 'Sex' },
                  { id: 6, label: 'Sáb' }
                ].map(dia => (
                  <label 
                    key={dia.id}
                    className={`flex items-center justify-center px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                      diasSemana.includes(dia.id) 
                        ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' 
                        : 'bg-bg-main border-border-subtle text-text-sec hover:border-text-sec'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={diasSemana.includes(dia.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDiasSemana([...diasSemana, dia.id]);
                        } else {
                          setDiasSemana(diasSemana.filter(d => d !== dia.id));
                        }
                      }}
                    />
                    <span className="text-sm font-medium">{dia.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-sec">KPI Vinculado (Opcional)</label>
              <select 
                value={kpiVinculado} 
                onChange={(e) => setKpiVinculado(e.target.value)} 
                className="input-modern appearance-none"
              >
                <option value="">Nenhum KPI</option>
                {kpis.map(kpi => (
                  <option key={kpi.id} value={kpi.id}>{kpi.titulo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-text-sec">Meta Vinculada (Opcional)</label>
              <select 
                value={metaVinculada} 
                onChange={(e) => setMetaVinculada(e.target.value)} 
                className="input-modern appearance-none"
              >
                <option value="">Nenhuma Meta</option>
                {metas.map(meta => (
                  <option key={meta.id} value={meta.id}>{meta.titulo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border-subtle mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="btn-primary"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

