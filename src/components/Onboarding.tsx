import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { generateDeepeningQuestions, generateRoutineSuggestion } from '../services/geminiService';
import { UserProfile, HorarioFixo, Task, Habito } from '../types';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles, ChevronRight, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { getDataStringBrasil } from '../utils/dataUtils';

export function Onboarding() {
  const { setUserProfile, atualizarConfig, adicionarHorarioFixo, adicionarTask, adicionarHabito } = useApp();
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
  });
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [generatedRoutine, setGeneratedRoutine] = useState<any>(null);

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

  const handleNextStep = async () => {
    if (step === 1) {
      if (!formData.nome || !formData.dataNascimento) {
        alert("Por favor, preencha seu nome e data de nascimento.");
        return;
      }
      setLoading(true);
      setLoadingMessage('Gerando perguntas personalizadas...');
      try {
        const generatedQuestions = await generateDeepeningQuestions(formData);
        setQuestions(generatedQuestions);
        setAnswers(new Array(generatedQuestions.length).fill(''));
        setStep(2);
      } catch (error) {
        console.error("Failed to generate questions", error);
        setStep(2); // Fallback
      } finally {
        setLoading(false);
        setLoadingMessage('');
      }
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setLoading(true);
      setLoadingMessage('O Arquiteto está desenhando sua rotina ideal...');
      try {
        const routine = await generateRoutineSuggestion(formData, answers);
        setGeneratedRoutine(routine);
        setStep(4);
      } catch (error) {
        console.error("Failed to generate routine", error);
        alert("Ocorreu um erro ao gerar sua rotina. Por favor, tente novamente.");
      } finally {
        setLoading(false);
        setLoadingMessage('');
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
              horario: t.horario || undefined,
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
        
        atualizarConfig({ onboardingCompleted: true });
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
              <p className="text-text-sec">Configuração Inicial</p>
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
                    <h2 className="text-2xl font-bold mb-6">Passo 1: Informações Básicas</h2>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-text-sec">Nome</label>
                      <input name="nome" value={formData.nome} onChange={handleChange} className="input-modern" placeholder="Seu nome" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-text-sec">Data de Nascimento</label>
                        <input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} className="input-modern" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-text-sec">Expectativa de Vida (Anos)</label>
                        <input type="number" name="expectativaVida" value={formData.expectativaVida} onChange={(e) => setFormData({...formData, expectativaVida: Number(e.target.value)})} className="input-modern" min="1" max="120" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-text-sec">Hora que Acorda</label>
                        <input type="time" name="horaAcordar" value={formData.horaAcordar} onChange={handleChange} className="input-modern" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-text-sec">Hora que Dorme</label>
                        <input type="time" name="horaDormir" value={formData.horaDormir} onChange={handleChange} className="input-modern" required />
                      </div>
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
                        {getHorasDisponiveis()!.horasDormindo > 10 && (
                          <div className="flex items-start gap-2 text-accent-purple text-sm mt-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <p>Você está dormindo {getHorasDisponiveis()?.horasDormindo.toFixed(1)}h. Muito tempo de sono pode reduzir seu tempo útil.</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2 text-text-sec">Objetivos de Produtividade</label>
                      <textarea name="objetivos" value={formData.objetivos} onChange={handleChange} className="input-modern min-h-[80px] resize-y" placeholder="O que você quer alcançar?" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-text-sec">Rotina Atual</label>
                      <textarea name="rotina" value={formData.rotina} onChange={handleChange} className="input-modern min-h-[80px] resize-y" placeholder="Descreva seu dia a dia (trabalho, estudos, etc.)" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-text-sec">Hábitos Atuais</label>
                      <textarea name="habitosAtuais" value={formData.habitosAtuais} onChange={handleChange} className="input-modern min-h-[80px] resize-y" placeholder="Quais hábitos você já tem?" />
                    </div>
                     <div>
                      <label className="block text-sm font-medium mb-2 text-text-sec">Horários Disponíveis</label>
                      <textarea name="horariosDisponiveis" value={formData.horariosDisponiveis} onChange={handleChange} className="input-modern min-h-[80px] resize-y" placeholder="Quando você tem tempo livre?" />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5 animate-slide-up">
                    <h2 className="text-2xl font-bold mb-6">Passo 2: Aprofundamento</h2>
                    <p className="text-text-sec mb-4">Para personalizar melhor sua experiência, responda a estas perguntas:</p>
                    {questions.map((q, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium mb-2 text-text-sec">{q}</label>
                        <textarea 
                          value={answers[index]} 
                          onChange={(e) => {
                            const newAnswers = [...answers];
                            newAnswers[index] = e.target.value;
                            setAnswers(newAnswers);
                          }} 
                          className="input-modern min-h-[80px] resize-y" 
                        />
                      </div>
                    ))}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5 animate-slide-up">
                    <h2 className="text-2xl font-bold mb-6">Passo 3: Shokunin (Maestria)</h2>
                    <p className="text-text-sec mb-4">A filosofia Shokunin envolve a dedicação total e a busca constante pela perfeição em sua arte ou profissão.</p>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-text-sec">
                        Em que área você busca maestria e dedicação total?
                      </label>
                      <textarea name="shokunin" value={formData.shokunin} onChange={handleChange} className="input-modern min-h-[80px] resize-y" placeholder="Ex: Programação, Design, Escrita, Música..." />
                    </div>
                  </div>
                )}

                {step === 4 && generatedRoutine && (
                  <div className="space-y-5 animate-slide-up">
                    <h2 className="text-2xl font-bold mb-6">Passo 4: Revisão da Rotina</h2>
                    <p className="text-text-sec mb-4">O Arquiteto gerou as seguintes tarefas. Você pode ajustar a frequência sugerida antes de finalizar.</p>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {generatedRoutine.tasks.map((task: any, index: number) => (
                        <div key={index} className="bg-bg-sec border border-border-subtle p-4 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">{task.titulo}</h3>
                            <span className="text-xs font-medium px-2 py-1 bg-bg-main rounded-md border border-border-subtle capitalize">
                              {task.categoria}
                            </span>
                          </div>
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {!loading && (
            <div className="mt-10 pt-6 border-t border-border-subtle flex justify-end">
              <button 
                onClick={handleNextStep} 
                disabled={loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 4 ? (
                  <>Finalizar <Sparkles size={18} /></>
                ) : step === 3 ? (
                  <>Gerar Rotina <Sparkles size={18} /></>
                ) : (
                  <>Próximo <ChevronRight size={18} /></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


