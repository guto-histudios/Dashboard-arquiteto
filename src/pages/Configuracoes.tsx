import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Save, Trash2, Plus, Settings, Clock, AlertTriangle, RefreshCw, Palette, Edit2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { HorarioFixo, TipoHorarioFixo } from '../types';
import { getDataStringBrasil } from '../utils/dataUtils';
import { THEMES } from '../utils/themeUtils';

export function Configuracoes() {
  const { 
    userProfile, setUserProfile, 
    horariosFixos, adicionarHorarioFixo, removerHorarioFixo, atualizarHorarioFixo,
    config, atualizarConfig,
    tasks, setTasks, atualizarTask,
    habitos, setHabitos
  } = useApp();
  
  const [profile, setProfile] = useState(userProfile || {
    nome: '',
    dataNascimento: '',
    expectativaVida: 75,
    objetivos: '',
    rotina: '',
    habitosAtuais: '',
    horariosDisponiveis: '',
    haraHachiBu: '',
    shokunin: '',
  });

  const [newHorario, setNewHorario] = useState<Partial<HorarioFixo>>({
    tipo: 'outro',
    horaInicio: '',
    descricao: '',
  });

  const [pomodoroConfig, setPomodoroConfig] = useState({
    duracaoPomodoro: config.duracaoPomodoro,
    duracaoPausaCurta: config.duracaoPausaCurta,
    duracaoPausaLonga: config.duracaoPausaLonga,
    pomodorosAntesPause: config.pomodorosAntesPause,
    tema: config.tema || 'roxo',
  });

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleSaveProfile = () => {
    setUserProfile(profile);
    atualizarConfig(pomodoroConfig);
    alert('Configurações salvas com sucesso!');
  };

  const [editingHorarioId, setEditingHorarioId] = useState<string | null>(null);

  const handleAddHorario = () => {
    if (newHorario.horaInicio && newHorario.descricao) {
      if (editingHorarioId) {
        atualizarHorarioFixo(editingHorarioId, {
          tipo: newHorario.tipo as TipoHorarioFixo,
          horaInicio: newHorario.horaInicio,
          horaFim: newHorario.horaFim,
          descricao: newHorario.descricao,
        });
        
        // Sync tasks
        const tasksToUpdate = tasks.filter(t => t.horarioFixoId === editingHorarioId);
        tasksToUpdate.forEach(task => {
          let duracao = task.duracao;
          if (newHorario.horaFim) {
            const [h1, m1] = newHorario.horaInicio.split(':').map(Number);
            const [h2, m2] = newHorario.horaFim.split(':').map(Number);
            let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
            if (diff < 0) diff += 24 * 60;
            duracao = diff;
          }
          atualizarTask(task.id, {
            horario: newHorario.horaInicio,
            duracao: duracao,
            titulo: newHorario.descricao
          });
        });
        
        setEditingHorarioId(null);
      } else {
        adicionarHorarioFixo({
          id: uuidv4(),
          tipo: newHorario.tipo as TipoHorarioFixo,
          horaInicio: newHorario.horaInicio,
          horaFim: newHorario.horaFim,
          descricao: newHorario.descricao,
        });
      }
      setNewHorario({ tipo: 'outro', horaInicio: '', descricao: '' });
    }
  };

  const handleEditHorario = (horario: HorarioFixo) => {
    setNewHorario({
      tipo: horario.tipo,
      horaInicio: horario.horaInicio,
      horaFim: horario.horaFim || '',
      descricao: horario.descricao
    });
    setEditingHorarioId(horario.id);
  };

  const handleFullReset = () => {
    localStorage.removeItem('tasks');
    localStorage.removeItem('habitos');
    localStorage.removeItem('metas');
    localStorage.removeItem('kpis');
    localStorage.removeItem('healthData');
    localStorage.removeItem('workoutPlan');
    localStorage.removeItem('configuracoes');
    localStorage.removeItem('horariosFixos');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('ultimoAcesso');
    
    window.location.href = '/';
  };

  const handleQuickReset = () => {
    const hoje = getDataStringBrasil();
    
    // Reset today's tasks
    const updatedTasks = tasks.map(task => {
      if (task.data === hoje && (task.status === 'concluida' || task.status === 'nao_feita')) {
        return { ...task, status: 'nao_iniciada' as const, xpGanho: false };
      }
      return task;
    });
    setTasks(updatedTasks);

    // Reset today's habits
    const updatedHabits = habitos.map(habito => {
      const filteredConclusoes = habito.conclusoes.filter(c => c.data !== hoje);
      return { ...habito, conclusoes: filteredConclusoes };
    });
    setHabitos(updatedHabits);

    alert('Tarefas e hábitos de hoje foram resetados!');
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-text-sec/10 rounded-xl">
          <Settings size={28} className="text-text-main" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Configurações</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Perfil */}
        <div className="glass-card p-8">
          <div className="flex justify-between items-center mb-8 border-b border-border-subtle pb-4">
            <h2 className="text-2xl font-bold tracking-tight">Meu Perfil</h2>
            <button 
              onClick={handleSaveProfile}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              Salvar
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-sec">Nome</label>
              <input 
                value={profile.nome} 
                onChange={(e) => setProfile({ ...profile, nome: e.target.value })} 
                className="input-modern"
                placeholder="Seu nome"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Data de Nascimento</label>
                <input 
                  type="date"
                  value={profile.dataNascimento || ''} 
                  onChange={(e) => setProfile({ ...profile, dataNascimento: e.target.value })} 
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Expectativa de Vida</label>
                <input 
                  type="number"
                  value={profile.expectativaVida || 75} 
                  onChange={(e) => setProfile({ ...profile, expectativaVida: Number(e.target.value) })} 
                  className="input-modern"
                  min="1"
                  max="120"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-text-sec">Objetivos Principais</label>
              <textarea 
                value={profile.objetivos} 
                onChange={(e) => setProfile({ ...profile, objetivos: e.target.value })} 
                className="input-modern min-h-[100px] resize-y"
                placeholder="Quais são seus maiores objetivos?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-text-sec">Rotina Atual</label>
              <textarea 
                value={profile.rotina} 
                onChange={(e) => setProfile({ ...profile, rotina: e.target.value })} 
                className="input-modern min-h-[100px] resize-y"
                placeholder="Descreva sua rotina atual..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Theme Settings */}
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold tracking-tight mb-8 border-b border-border-subtle pb-4 flex items-center gap-2">
              <Palette size={24} className="text-accent-purple" />
              Aparência
            </h2>
            
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-2 text-text-sec">Tema de Cores</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.values(THEMES).map((tema) => (
                  <button
                    key={tema.id}
                    onClick={() => setPomodoroConfig({ ...pomodoroConfig, tema: tema.id })}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
                      pomodoroConfig.tema === tema.id 
                        ? 'bg-bg-sec border-accent-purple shadow-lg shadow-accent-purple/20' 
                        : 'bg-bg-sec/50 border-border-subtle hover:border-text-sec'
                    }`}
                  >
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: tema.primary }}></div>
                      <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: tema.secondary }}></div>
                    </div>
                    <span className="text-sm font-medium text-text-main">{tema.nome}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pomodoro Settings */}
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold tracking-tight mb-8 border-b border-border-subtle pb-4 flex items-center gap-2">
              <Clock size={24} className="text-accent-purple" />
              Pomodoro
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Foco (min)</label>
                <input 
                  type="number"
                  value={pomodoroConfig.duracaoPomodoro} 
                  onChange={(e) => setPomodoroConfig({ ...pomodoroConfig, duracaoPomodoro: Number(e.target.value) })} 
                  className="input-modern"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Pausa Curta (min)</label>
                <input 
                  type="number"
                  value={pomodoroConfig.duracaoPausaCurta} 
                  onChange={(e) => setPomodoroConfig({ ...pomodoroConfig, duracaoPausaCurta: Number(e.target.value) })} 
                  className="input-modern"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Pausa Longa (min)</label>
                <input 
                  type="number"
                  value={pomodoroConfig.duracaoPausaLonga} 
                  onChange={(e) => setPomodoroConfig({ ...pomodoroConfig, duracaoPausaLonga: Number(e.target.value) })} 
                  className="input-modern"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Ciclos até Pausa Longa</label>
                <input 
                  type="number"
                  value={pomodoroConfig.pomodorosAntesPause} 
                  onChange={(e) => setPomodoroConfig({ ...pomodoroConfig, pomodorosAntesPause: Number(e.target.value) })} 
                  className="input-modern"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Horários Fixos */}
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold tracking-tight mb-8 border-b border-border-subtle pb-4">Horários Fixos</h2>

            <div className="space-y-3 mb-8">
              {horariosFixos.map(horario => (
                <div key={horario.id} className="flex items-center justify-between bg-bg-sec border border-border-subtle p-4 rounded-xl group hover:border-accent-blue/50 transition-colors">
                  <div>
                    <span className="font-bold text-lg text-white">{horario.horaInicio} {horario.horaFim ? `- ${horario.horaFim}` : ''}</span>
                    <p className="text-sm text-text-sec mt-1">{horario.descricao}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditHorario(horario)}
                      className="text-text-sec hover:text-accent-blue p-2 bg-bg-main rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => removerHorarioFixo(horario.id)}
                      className="text-text-sec hover:text-error p-2 bg-bg-main rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {horariosFixos.length === 0 && (
                <p className="text-text-sec text-center py-4">Nenhum horário fixo cadastrado.</p>
              )}
            </div>

            <div className="bg-bg-sec border border-border-subtle p-5 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">{editingHorarioId ? 'Editar Horário' : 'Adicionar Novo Horário'}</h3>
                {editingHorarioId && (
                  <button 
                    onClick={() => {
                      setEditingHorarioId(null);
                      setNewHorario({ tipo: 'outro', horaInicio: '', descricao: '' });
                    }}
                    className="text-sm text-text-sec hover:text-white"
                  >
                    Cancelar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium mb-1 text-text-sec">Início</label>
                  <input 
                    type="time"
                    value={newHorario.horaInicio} 
                    onChange={(e) => setNewHorario({ ...newHorario, horaInicio: e.target.value })} 
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-text-sec">Fim (opcional)</label>
                  <input 
                    type="time"
                    value={newHorario.horaFim || ''} 
                    onChange={(e) => setNewHorario({ ...newHorario, horaFim: e.target.value })} 
                    className="input-modern"
                  />
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-xs font-medium mb-1 text-text-sec">Descrição</label>
                <input 
                  value={newHorario.descricao} 
                  onChange={(e) => setNewHorario({ ...newHorario, descricao: e.target.value })} 
                  className="input-modern"
                  placeholder="Ex: Academia, Almoço, Reunião Diária"
                />
              </div>
              <button 
                onClick={handleAddHorario}
                className="w-full bg-bg-main border border-border-subtle hover:bg-border-subtle hover:text-white text-text-main px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 font-medium"
              >
                <Plus size={18} />
                Adicionar Horário
              </button>
            </div>
          </div>

          {/* Reset System */}
          <div className="glass-card p-8 border-t-4 border-error">
            <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2 text-error">
              <AlertTriangle size={24} />
              Zona de Perigo
            </h2>
            
            <div className="space-y-4">
              <div className="bg-bg-sec border border-border-subtle p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-white mb-1">Reset Rápido (Hoje)</h3>
                  <p className="text-sm text-text-sec">Reseta apenas as tarefas e hábitos concluídos do dia atual.</p>
                </div>
                <button 
                  onClick={handleQuickReset}
                  className="bg-bg-main border border-border-subtle text-text-main hover:bg-border-subtle hover:text-white px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors"
                >
                  <RefreshCw size={16} />
                  Reset Rápido
                </button>
              </div>

              <div className="bg-error/10 border border-error/20 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-error mb-1">Resetar Sistema Completo</h3>
                  <p className="text-sm text-error/80">Apaga TODOS os dados, tarefas, hábitos, metas e configurações.</p>
                </div>
                <button 
                  onClick={() => setIsResetModalOpen(true)}
                  className="bg-error text-white hover:bg-error/80 px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors shadow-lg shadow-error/20"
                >
                  <Trash2 size={16} />
                  Limpar Dados
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-sec border border-error/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-error/10 animate-slide-up">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-error" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Tem certeza que deseja resetar?</h2>
              <p className="text-text-sec mb-6">
                Isso irá apagar <strong className="text-error">TODOS</strong> os dados: tasks, hábitos, metas, KPIs, planos de treino e configurações. Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 bg-bg-main border border-border-subtle text-text-main hover:bg-border-subtle px-4 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleFullReset}
                  className="flex-1 bg-error text-white hover:bg-error/90 px-4 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-error/20"
                >
                  Confirmar Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

