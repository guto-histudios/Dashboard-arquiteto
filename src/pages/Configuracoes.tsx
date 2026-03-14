import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Save, Trash2, Plus, Settings, Clock, AlertTriangle, RefreshCw, Palette, Edit2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { HorarioFixo, TipoHorarioFixo } from '../types';
import { getDataStringBrasil } from '../utils/dataUtils';
import { THEMES } from '../utils/themeUtils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';

export function Configuracoes() {
  const navigate = useNavigate();
  const { 
    userProfile, setUserProfile, 
    horariosFixos, adicionarHorarioFixo, removerHorarioFixo, atualizarHorarioFixo,
    config, atualizarConfig,
    tasks, setTasks, atualizarTask,
    habitos, setHabitos,
    setMetas, setKPIs,
    resetGamification
  } = useApp();
  
  const [profile, setProfile] = useState(userProfile || {
    nome: '',
    dataNascimento: '',
    expectativaVida: 75,
    objetivos: '',
    rotina: '',
    habitosAtuais: '',
    horariosDisponiveis: '',
    horaAcordar: '07:00',
    horaDormir: '23:00',
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
            horarioInicio: newHorario.horaInicio,
            horarioFim: newHorario.horaFim,
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
    // 1. Limpar localStorage completamente
    localStorage.clear();
    
    // 2. Resetar states
    setTasks([]);
    setHabitos([]);
    setMetas([]);
    setKPIs([]);
    setUserProfile(null);
    resetGamification();
    
    // Limpar dados temporários de onboarding se houver
    localStorage.removeItem('onboarding_temp_data');
    localStorage.removeItem('onboarding_temp_step');
    
    // 3. Redirecionar para o início e forçar recarregamento para limpar estados residuais
    navigate('/');
    window.location.reload();
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
        <div className="p-3 bg-bg-sec rounded-xl border border-border-subtle">
          <Settings size={28} className="text-text-main" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-serif font-bold tracking-tight text-text-main">Configurações</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Perfil */}
        <Card className="p-8">
          <div className="flex justify-between items-center mb-8 border-b border-border-subtle pb-4">
            <h2 className="text-2xl font-serif font-bold tracking-tight text-text-main">Meu Perfil</h2>
            <Button 
              onClick={handleSaveProfile}
              className="flex items-center gap-2"
            >
              <Save size={18} strokeWidth={1.5} />
              Salvar
            </Button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-sec">Nome</label>
              <Input 
                value={profile.nome} 
                onChange={(e) => setProfile({ ...profile, nome: e.target.value })} 
                placeholder="Seu nome"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Data de Nascimento</label>
                <Input 
                  type="date"
                  value={profile.dataNascimento || ''} 
                  onChange={(e) => setProfile({ ...profile, dataNascimento: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Expectativa de Vida</label>
                <Input 
                  type="number"
                  value={profile.expectativaVida || 75} 
                  onChange={(e) => setProfile({ ...profile, expectativaVida: Number(e.target.value) })} 
                  min="1"
                  max="120"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Hora que Acorda</label>
                <Input 
                  type="time"
                  value={profile.horaAcordar || '07:00'} 
                  onChange={(e) => setProfile({ ...profile, horaAcordar: e.target.value })} 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Hora que Dorme</label>
                <Input 
                  type="time"
                  value={profile.horaDormir || '23:00'} 
                  onChange={(e) => setProfile({ ...profile, horaDormir: e.target.value })} 
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-text-sec">Objetivos Principais</label>
              <Textarea 
                value={profile.objetivos} 
                onChange={(e) => setProfile({ ...profile, objetivos: e.target.value })} 
                placeholder="Quais são seus maiores objetivos?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-text-sec">Rotina Atual</label>
              <Textarea 
                value={profile.rotina} 
                onChange={(e) => setProfile({ ...profile, rotina: e.target.value })} 
                placeholder="Descreva sua rotina atual..."
              />
            </div>
          </div>
        </Card>

        <div className="space-y-8">
          {/* Theme Settings */}
          <Card className="p-8">
            <h2 className="text-2xl font-serif font-bold tracking-tight mb-8 border-b border-border-subtle pb-4 flex items-center gap-2 text-text-main">
              <Palette size={24} className="text-accent-purple" strokeWidth={1.5} />
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
                        : 'bg-bg-main border-border-subtle hover:border-text-muted'
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
          </Card>

          {/* Pomodoro Settings */}
          <Card className="p-8">
            <h2 className="text-2xl font-serif font-bold tracking-tight mb-8 border-b border-border-subtle pb-4 flex items-center gap-2 text-text-main">
              <Clock size={24} className="text-accent-purple" strokeWidth={1.5} />
              Pomodoro
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Foco (min)</label>
                <Input 
                  type="number"
                  value={pomodoroConfig.duracaoPomodoro} 
                  onChange={(e) => setPomodoroConfig({ ...pomodoroConfig, duracaoPomodoro: Number(e.target.value) })} 
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Pausa Curta (min)</label>
                <Input 
                  type="number"
                  value={pomodoroConfig.duracaoPausaCurta} 
                  onChange={(e) => setPomodoroConfig({ ...pomodoroConfig, duracaoPausaCurta: Number(e.target.value) })} 
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Pausa Longa (min)</label>
                <Input 
                  type="number"
                  value={pomodoroConfig.duracaoPausaLonga} 
                  onChange={(e) => setPomodoroConfig({ ...pomodoroConfig, duracaoPausaLonga: Number(e.target.value) })} 
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-sec">Ciclos até Pausa Longa</label>
                <Input 
                  type="number"
                  value={pomodoroConfig.pomodorosAntesPause} 
                  onChange={(e) => setPomodoroConfig({ ...pomodoroConfig, pomodorosAntesPause: Number(e.target.value) })} 
                  min="1"
                />
              </div>
            </div>
          </Card>

          {/* Horários Fixos */}
          <Card className="p-8">
            <h2 className="text-2xl font-serif font-bold tracking-tight mb-8 border-b border-border-subtle pb-4 text-text-main">Horários Fixos</h2>

            <div className="space-y-3 mb-8">
              {horariosFixos.map(horario => (
                <div key={horario.id} className="flex items-center justify-between bg-bg-sec border border-border-subtle p-4 rounded-xl group hover:border-accent-blue/50 transition-colors">
                  <div>
                    <span className="font-bold text-lg text-text-main">{horario.horaInicio} {horario.horaFim ? `- ${horario.horaFim}` : ''}</span>
                    <p className="text-sm text-text-sec mt-1">{horario.descricao}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditHorario(horario)}
                      className="text-text-sec hover:text-accent-blue p-2 bg-bg-main rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Edit2 size={18} strokeWidth={1.5} />
                    </button>
                    <button 
                      onClick={() => removerHorarioFixo(horario.id)}
                      className="text-text-sec hover:text-error p-2 bg-bg-main rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} strokeWidth={1.5} />
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
                <h3 className="text-lg font-medium text-text-main">{editingHorarioId ? 'Editar Horário' : 'Adicionar Novo Horário'}</h3>
                {editingHorarioId && (
                  <button 
                    onClick={() => {
                      setEditingHorarioId(null);
                      setNewHorario({ tipo: 'outro', horaInicio: '', descricao: '' });
                    }}
                    className="text-sm text-text-sec hover:text-text-main"
                  >
                    Cancelar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium mb-1 text-text-sec">Início</label>
                  <Input 
                    type="time"
                    value={newHorario.horaInicio} 
                    onChange={(e) => setNewHorario({ ...newHorario, horaInicio: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-text-sec">Fim (opcional)</label>
                  <Input 
                    type="time"
                    value={newHorario.horaFim || ''} 
                    onChange={(e) => setNewHorario({ ...newHorario, horaFim: e.target.value })} 
                  />
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-xs font-medium mb-1 text-text-sec">Descrição</label>
                <Input 
                  value={newHorario.descricao} 
                  onChange={(e) => setNewHorario({ ...newHorario, descricao: e.target.value })} 
                  placeholder="Ex: Academia, Almoço, Reunião Diária"
                />
              </div>
              <Button 
                onClick={handleAddHorario}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <Plus size={18} strokeWidth={1.5} />
                Adicionar Horário
              </Button>
            </div>
          </Card>

          {/* Reset System */}
          <Card className="p-8 border-t-4 border-error">
            <h2 className="text-2xl font-serif font-bold tracking-tight mb-6 flex items-center gap-2 text-error">
              <AlertTriangle size={24} strokeWidth={1.5} />
              Zona de Perigo
            </h2>
            
            <div className="space-y-4">
              <div className="bg-bg-sec border border-border-subtle p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-text-main mb-1">Reset Rápido (Hoje)</h3>
                  <p className="text-sm text-text-sec">Reseta apenas as tarefas e hábitos concluídos do dia atual.</p>
                </div>
                <Button 
                  onClick={handleQuickReset}
                  variant="outline"
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <RefreshCw size={16} strokeWidth={1.5} />
                  Reset Rápido
                </Button>
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
                  <Trash2 size={16} strokeWidth={1.5} />
                  Resetar Sistema
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-sec border border-error/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-error/10 animate-slide-up">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-error" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-serif font-bold text-text-main mb-2">Isso vai apagar TUDO. Continuar?</h2>
              <p className="text-text-sec mb-6">
                Esta ação irá apagar permanentemente suas tasks, hábitos, metas, KPIs, XP, nível, moedas e badges. Você voltará para a tela inicial.
              </p>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => setIsResetModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <button 
                  onClick={handleFullReset}
                  className="flex-1 bg-error text-white hover:bg-error/90 px-4 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-error/20"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

