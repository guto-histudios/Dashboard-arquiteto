import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { generateRoutineSuggestion, generateRound2Questions, generateRound3Questions } from '../services/geminiService';
import { UserProfile, HorarioFixo, Task, Habito, Meta, KPI } from '../types';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles, ChevronRight, Loader2, AlertTriangle, Clock, Target } from 'lucide-react';
import { getDataStringBrasil } from '../utils/dataUtils';
import { addDays } from 'date-fns';

export function Onboarding() {
  const { setUserProfile, atualizarConfig, adicionarHorarioFixo, adicionarTask, adicionarHabito, adicionarMeta, adicionarKPI, criarPlano } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [formData, setFormData] = useState<UserProfile>({
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
    profissao: '',
    habitosDesejados: '',
    habitosAbandonar: '',
    tempoNovosHabitos: '',
    metasCurtoPrazo: '',
    metasLongoPrazo: '',
    kpisAcompanhar: '',
    definicaoSucesso: '',
    preferenciaBlocos: 'misturado',
  });
  const [generatedRoutine, setGeneratedRoutine] = useState<any>(null);
  const [round2Questions, setRound2Questions] = useState<string[]>([]);
  const [round3Questions, setRound3Questions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [round2Answers, setRound2Answers] = useState<{question: string, answer: string}[]>([]);
  const [round3Answers, setRound3Answers] = useState<{question: string, answer: string}[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);

  // Load temporary data on mount
  React.useEffect(() => {
    const savedData = localStorage.getItem('onboarding_temp_data');
    const savedStep = localStorage.getItem('onboarding_temp_step');
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (e) {
        console.error("Error parsing saved onboarding data", e);
      }
    }
    if (savedStep) {
      const s = parseInt(savedStep);
      if (s >= 1 && s <= 4) setStep(s);
    }
  }, []);

  // Save temporary data on change
  React.useEffect(() => {
    localStorage.setItem('onboarding_temp_data', JSON.stringify(formData));
    localStorage.setItem('onboarding_temp_step', step.toString());
  }, [formData, step]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getHorasDisponiveis = () => {
    if (!formData.horaAcordar || !formData.horaDormir) return null;
    
    const [hA, mA] = formData.horaAcordar.split(':').map(Number);
    const [hD, mD] = formData.horaDormir.split(':').map(Number);
    
    let totalMinutos = (hD * 60 + mD) - (hA * 60 + mA);
    if (totalMinutos <= 0) {
      totalMinutos += 24 * 60;
    }
    
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    const minutosDormindo = (24 * 60) - totalMinutos;
    const horasDormindo = minutosDormindo / 60;
    
    return { horas, minutos, totalMinutos, horasDormindo };
  };

  const isStepValid = () => {
    if (step === 1) {
      return formData.nome && formData.horaAcordar && formData.horaDormir && formData.rotina;
    }
    if (step === 2 || step === 3) {
      return currentAnswer.trim().length > 0;
    }
    return true;
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (!isStepValid()) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
      }
      setLoading(true);
      setLoadingMessage('Analisando sua rotina...');
      try {
        const questions = await generateRound2Questions(formData.rotina);
        setRound2Questions(questions);
        setCurrentQuestionIndex(0);
        setStep(2);
      } catch (error) {
        console.error("Failed to generate questions", error);
        alert("Ocorreu um erro. Por favor, tente novamente.");
      } finally {
        setLoading(false);
        setLoadingMessage('');
      }
    } else if (step === 2) {
      if (!isStepValid()) return;
      
      const newAnswers = [...round2Answers, { question: round2Questions[currentQuestionIndex], answer: currentAnswer }];
      setRound2Answers(newAnswers);
      setCurrentAnswer('');

      if (currentQuestionIndex < round2Questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setLoading(true);
        setLoadingMessage('Preparando metas...');
        try {
          const questions = await generateRound3Questions(formData.rotina, newAnswers);
          setRound3Questions(questions);
          setCurrentQuestionIndex(0);
          setStep(3);
        } catch (error) {
          console.error("Failed to generate questions", error);
          alert("Ocorreu um erro. Por favor, tente novamente.");
        } finally {
          setLoading(false);
          setLoadingMessage('');
        }
      }
    } else if (step === 3) {
      if (!isStepValid()) return;

      const newAnswers = [...round3Answers, { question: round3Questions[currentQuestionIndex], answer: currentAnswer }];
      setRound3Answers(newAnswers);
      setCurrentAnswer('');

      if (currentQuestionIndex < round3Questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setLoading(true);
        setLoadingMessage('O Arquiteto está desenhando sua rotina ideal...');
        try {
          const routine = await generateRoutineSuggestion(formData, round2Answers, newAnswers);
          setGeneratedRoutine(routine);
          setStep(4);
        } catch (error) {
          console.error("Failed to generate routine", error);
          alert("Ocorreu um erro ao gerar sua rotina. Por favor, tente novamente.");
        } finally {
          setLoading(false);
          setLoadingMessage('');
        }
      }
    } else if (step === 4) {
      setLoading(true);
      setLoadingMessage('Salvando sua rotina...');
      try {
        // Save profile
        setUserProfile(formData);
        
        // Add default fixed times
        const defaultFixedTimes: HorarioFixo[] = [
          { id: uuidv4(), tipo: 'sono_inicio', horaInicio: formData.horaDormir || '23:00', descricao: 'Dormir' },
          { id: uuidv4(), tipo: 'sono_fim', horaInicio: formData.horaAcordar || '06:00', descricao: 'Acordar' },
        ];
        
        defaultFixedTimes.forEach(time => adicionarHorarioFixo(time));

        const hoje = getDataStringBrasil();

        if (generatedRoutine && generatedRoutine.tasks) {
          generatedRoutine.tasks.forEach((t: any) => {
            const newTask: Task = {
              id: uuidv4(),
              titulo: t.titulo || 'Nova Tarefa',
              descricao: t.descricao || '',
              duracao: t.duracao || 30,
              categoria: t.categoria || 'pessoal',
              prioridade: t.prioridade || 'media',
              status: 'nao_iniciada',
              data: t.dataInicio || hoje,
              dataInicio: t.dataInicio || undefined,
              dataFim: t.dataFim || undefined,
              horarioInicio: t.horarioInicio || undefined,
              horarioFim: t.horarioFim || undefined,
              diasSemana: t.diasSemana || undefined,
              tipoRepeticao: t.tipoRepeticao || 'nenhuma',
              justificativaFrequencia: t.justificativaFrequencia || undefined,
              vezAtual: 1,
              xpGanho: false,
              pomodorosFeitos: 0,
            };
            adicionarTask(newTask);
          });
        }

        if (generatedRoutine && generatedRoutine.habitos) {
          generatedRoutine.habitos.forEach((h: any) => {
            const newHabito: Habito = {
              id: uuidv4(),
              nome: h.nome || 'Novo Hábito',
              categoria: h.categoria || 'pessoal',
              diasSemana: h.diasSemana || [0, 1, 2, 3, 4, 5, 6],
              horario: h.horario || '',
              conclusoes: [],
              streak: 0,
            };
            adicionarHabito(newHabito);
          });
        }

        if (generatedRoutine && generatedRoutine.planoTrimestral) {
          const pt = generatedRoutine.planoTrimestral;
          criarPlano(pt.objetivoPrincipal);

          const dataFimTrimestre = getDataStringBrasil(addDays(new Date(hoje), 90));

          // Meta Trimestral
          if (pt.metaTrimestral) {
            adicionarMeta({
              id: uuidv4(),
              titulo: pt.metaTrimestral.titulo,
              descricao: pt.metaTrimestral.descricao,
              periodo: 'trimestral',
              dataInicio: hoje,
              dataFim: dataFimTrimestre,
              progresso: 0,
              status: 'nao_iniciada',
              tasksVinculadas: [],
              ehIkigai: false,
              ehShokunin: false
            });
          }

          // Metas Mensais
          if (pt.metasMensais && pt.metasMensais.length > 0) {
            pt.metasMensais.forEach((m: any, idx: number) => {
              adicionarMeta({
                id: uuidv4(),
                titulo: m.titulo,
                descricao: m.descricao,
                periodo: 'mensal',
                dataInicio: getDataStringBrasil(addDays(new Date(hoje), idx * 30)),
                dataFim: getDataStringBrasil(addDays(new Date(hoje), (idx + 1) * 30)),
                progresso: 0,
                status: 'nao_iniciada',
                tasksVinculadas: [],
                ehIkigai: false,
                ehShokunin: false
              });
            });
          }

          // Metas Semanais
          if (pt.metasSemanais && pt.metasSemanais.length > 0) {
            pt.metasSemanais.forEach((m: any, idx: number) => {
              adicionarMeta({
                id: uuidv4(),
                titulo: m.titulo,
                descricao: m.descricao,
                periodo: 'semanal',
                dataInicio: getDataStringBrasil(addDays(new Date(hoje), idx * 7)),
                dataFim: getDataStringBrasil(addDays(new Date(hoje), (idx + 1) * 7)),
                progresso: 0,
                status: 'nao_iniciada',
                tasksVinculadas: [],
                ehIkigai: false,
                ehShokunin: false
              });
            });
          }

          // KPIs
          if (pt.kpis && pt.kpis.length > 0) {
            pt.kpis.forEach((k: any) => {
              adicionarKPI({
                id: uuidv4(),
                titulo: k.titulo,
                valorAtual: 0,
                valorMeta: k.valorMeta || 100,
                unidade: k.unidade || 'un',
                tipoCalculo: 'manual',
                frequencia: 'semanal',
                dataInicio: hoje,
                historico: []
              });
            });
          }
        }
        
        atualizarConfig({ onboardingCompleted: true });
        localStorage.removeItem('onboarding_temp_data');
        localStorage.removeItem('onboarding_temp_step');
        navigate('/');
      } catch (error) {
        console.error("Failed to save routine", error);
        alert("Ocorreu um erro ao salvar sua rotina. Por favor, tente novamente.");
      } finally {
        setLoading(false);
        setLoadingMessage('');
      }
    }
  };

  const handlePrevStep = () => {
    if (step === 2) {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        const prevAnswer = round2Answers[currentQuestionIndex - 1]?.answer || '';
        setCurrentAnswer(prevAnswer);
        setRound2Answers(round2Answers.slice(0, -1));
      } else {
        setStep(1);
      }
    } else if (step === 3) {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        const prevAnswer = round3Answers[currentQuestionIndex - 1]?.answer || '';
        setCurrentAnswer(prevAnswer);
        setRound3Answers(round3Answers.slice(0, -1));
      } else {
        setStep(2);
        setCurrentQuestionIndex(round2Questions.length - 1);
        const prevAnswer = round2Answers[round2Answers.length - 1]?.answer || '';
        setCurrentAnswer(prevAnswer);
        setRound2Answers(round2Answers.slice(0, -1));
      }
    } else if (step === 4) {
      setStep(3);
      setCurrentQuestionIndex(round3Questions.length - 1);
      const prevAnswer = round3Answers[round3Answers.length - 1]?.answer || '';
      setCurrentAnswer(prevAnswer);
      setRound3Answers(round3Answers.slice(0, -1));
    }
  };

  const getStepTitle = () => {
    if (step === 1) return 'Rodada 1 de 3: Sua Rotina';
    if (step === 2) return 'Rodada 2 de 3: Aprofundamento';
    if (step === 3) return 'Rodada 3 de 3: Metas e Objetivos';
    return 'Revisão Final';
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-2xl w-full animate-fade-in relative overflow-hidden">
        {/* Decorative gradient blob */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-blue/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent-purple/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-accent-blue to-accent-purple rounded-xl text-white">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">O Arquiteto</h1>
              <p className="text-text-sec">
                {getStepTitle()}
              </p>
            </div>
          </div>

          <div className="mb-8 flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-gradient-to-r from-accent-blue to-accent-purple' : 'bg-bg-sec border border-border-subtle'}`} />
            ))}
          </div>
        
          <div className="space-y-6 min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[300px] space-y-4 animate-fade-in">
                <div className="w-12 h-12 border-4 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"></div>
                <p className="text-lg font-medium text-text-sec animate-pulse">{loadingMessage}</p>
              </div>
            ) : (
              <>
                {step === 1 && (
                  <div className="space-y-5 animate-slide-up">
                    <h2 className="text-2xl font-bold mb-6">Como é o seu dia?</h2>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-text-sec">Seu Nome *</label>
                      <input name="nome" value={formData.nome} onChange={handleChange} className="input-modern" placeholder="Como devemos te chamar?" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-text-sec">Que horas você acorda? *</label>
                        <input type="time" name="horaAcordar" value={formData.horaAcordar} onChange={handleChange} className="input-modern" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-text-sec">Que horas você dorme? *</label>
                        <input type="time" name="horaDormir" value={formData.horaDormir} onChange={handleChange} className="input-modern" required />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-text-sec">Preferência de Blocos de Tempo *</label>
                      <select 
                        name="preferenciaBlocos" 
                        value={formData.preferenciaBlocos} 
                        onChange={(e) => setFormData({...formData, preferenciaBlocos: e.target.value as any})} 
                        className="input-modern"
                      >
                        <option value="curto">Curto (30 min) - Ideal para Pomodoro</option>
                        <option value="longo">Longo (60-90 min) - Para tarefas profundas</option>
                        <option value="misturado">Misturado - O sistema decide</option>
                      </select>
                      <p className="text-xs text-text-sec mt-2">
                        Como você prefere que tarefas longas sejam divididas na sua agenda.
                      </p>
                    </div>

                    {getHorasDisponiveis() && (
                      <div className="bg-bg-sec/50 border border-border-subtle p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock size={16} className="text-accent-blue" />
                          <span className="font-medium">
                            {getHorasDisponiveis()?.horas} horas e {getHorasDisponiveis()?.minutos} minutos disponíveis por dia
                          </span>
                        </div>
                        
                        {getHorasDisponiveis()!.horasDormindo < 6 && (
                          <div className="flex items-start gap-2 text-orange-400 text-sm mt-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <p>Você está dormindo apenas {getHorasDisponiveis()?.horasDormindo.toFixed(1)}h. Recomendamos pelo menos 7h de sono para manter a produtividade.</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2 text-text-sec">Descreva sua rotina *</label>
                      <textarea 
                        name="rotina" 
                        value={formData.rotina} 
                        onChange={handleChange} 
                        className="input-modern min-h-[160px] resize-y" 
                        placeholder="Descreva seu dia típico... Ex: acordo às 7h, trabalho das 8h-18h, facul às 18:30-22:30, faço edição de vídeo, quero reservar 240min pra edição, 1h pra exercício, 1h pra estudar..." 
                      />
                      <p className="text-xs text-text-sec mt-2">
                        A IA vai analisar seu texto para extrair seus horários, atividades fixas, dias específicos e prazos.
                      </p>
                    </div>
                  </div>
                )}

                {(step === 2 || step === 3) && (step === 2 ? round2Questions : round3Questions).length > 0 && (
                  <div className="space-y-5 animate-slide-up">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">
                        {step === 2 ? 'Aprofundando...' : 'Definindo Metas'}
                      </h2>
                      <span className="text-sm font-medium text-accent-blue bg-accent-blue/10 px-3 py-1 rounded-full">
                        Pergunta {currentQuestionIndex + 1} de {(step === 2 ? round2Questions : round3Questions).length}
                      </span>
                    </div>
                    
                    <div className="bg-bg-sec border border-border-subtle p-6 rounded-xl mb-6">
                      <p className="text-lg font-medium text-text-main">
                        {(step === 2 ? round2Questions : round3Questions)[currentQuestionIndex]}
                      </p>
                    </div>

                    <div>
                      <textarea 
                        value={currentAnswer} 
                        onChange={(e) => setCurrentAnswer(e.target.value)} 
                        className="input-modern min-h-[120px] resize-y" 
                        placeholder="Sua resposta..." 
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {step === 4 && generatedRoutine && (
                  <div className="space-y-5 animate-slide-up">
                    <h2 className="text-2xl font-bold mb-6">Revisão da Rotina</h2>
                    <p className="text-text-sec mb-4">O Arquiteto gerou as seguintes tarefas baseadas na sua descrição.</p>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {generatedRoutine.tasks.map((task: any, index: number) => (
                        <div key={index} className="bg-bg-sec border border-border-subtle p-4 rounded-xl">
                          {editingTaskIndex === index ? (
                            <div className="space-y-3">
                              <input 
                                type="text" 
                                value={task.titulo} 
                                onChange={(e) => {
                                  const newRoutine = { ...generatedRoutine };
                                  newRoutine.tasks[index].titulo = e.target.value;
                                  setGeneratedRoutine(newRoutine);
                                }}
                                className="input-modern w-full font-bold"
                              />
                              <div className="flex gap-2">
                                <input 
                                  type="time" 
                                  value={task.horarioInicio || ''} 
                                  onChange={(e) => {
                                    const newRoutine = { ...generatedRoutine };
                                    newRoutine.tasks[index].horarioInicio = e.target.value;
                                    setGeneratedRoutine(newRoutine);
                                  }}
                                  className="input-modern w-1/3"
                                />
                                <input 
                                  type="time" 
                                  value={task.horarioFim || ''} 
                                  onChange={(e) => {
                                    const newRoutine = { ...generatedRoutine };
                                    newRoutine.tasks[index].horarioFim = e.target.value;
                                    setGeneratedRoutine(newRoutine);
                                  }}
                                  className="input-modern w-1/3"
                                />
                                <input 
                                  type="number" 
                                  value={task.duracao} 
                                  onChange={(e) => {
                                    const newRoutine = { ...generatedRoutine };
                                    newRoutine.tasks[index].duracao = parseInt(e.target.value) || 0;
                                    setGeneratedRoutine(newRoutine);
                                  }}
                                  className="input-modern w-1/3"
                                  placeholder="Minutos"
                                />
                              </div>
                              <button 
                                onClick={() => setEditingTaskIndex(null)}
                                className="btn-primary w-full py-2 text-sm"
                              >
                                Salvar Alterações
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">{task.titulo}</h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium px-2 py-1 bg-bg-main rounded-md border border-border-subtle capitalize">
                                    {task.categoria}
                                  </span>
                                  <button 
                                    onClick={() => setEditingTaskIndex(index)}
                                    className="text-xs text-accent-blue hover:underline"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </div>
                              {task.horarioInicio && task.horarioFim && (
                                <div className="flex items-center gap-1 text-sm text-accent-blue mb-2 font-medium">
                                  <Clock size={14} />
                                  <span>{task.horarioInicio} - {task.horarioFim} ({task.duracao} min)</span>
                                </div>
                              )}
                              {task.descricao && <p className="text-sm text-text-sec mb-3">{task.descricao}</p>}
                              
                              <div className="bg-bg-main/50 p-3 rounded-lg border border-border-subtle/50 mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-sm font-medium">Frequência Sugerida:</label>
                                  <select 
                                    value={task.tipoRepeticao}
                                    onChange={(e) => {
                                      const newRoutine = { ...generatedRoutine };
                                      newRoutine.tasks[index].tipoRepeticao = e.target.value;
                                      setGeneratedRoutine(newRoutine);
                                    }}
                                    className="input-modern py-1 px-2 text-sm w-auto"
                                  >
                                    <option value="nenhuma">Nenhuma</option>
                                    <option value="diaria">Diária</option>
                                    <option value="diasSemana">Dias Específicos</option>
                                    <option value="semanal">Semanal</option>
                                    <option value="quinzenal">Quinzenal</option>
                                    <option value="mensal">Mensal</option>
                                  </select>
                                </div>
                                {task.justificativaFrequencia && (
                                  <p className="text-xs text-text-sec italic border-l-2 border-accent-blue/30 pl-2">
                                    "{task.justificativaFrequencia}"
                                  </p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {!loading && (
            <div className="mt-10 pt-6 border-t border-border-subtle flex justify-between items-center">
              <div>
                {step > 1 && (
                  <button 
                    onClick={handlePrevStep}
                    className="text-text-sec hover:text-text-main transition-colors flex items-center gap-1"
                  >
                    Voltar
                  </button>
                )}
              </div>
              <button 
                onClick={handleNextStep} 
                disabled={loading || !isStepValid()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 4 ? (
                  <>Finalizar <Sparkles size={18} /></>
                ) : (
                  <>Próxima <ChevronRight size={18} /></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



