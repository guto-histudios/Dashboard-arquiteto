import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { generateDeepeningQuestions, generateRoutineSuggestion } from '../services/geminiService';
import { UserProfile, HorarioFixo, Task, Habito } from '../types';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles, ChevronRight, Loader2 } from 'lucide-react';
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
    haraHachiBu: '',
    shokunin: '',
  });
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        
        // Save profile
        setUserProfile(formData);
        
        // Add default fixed times
        const defaultFixedTimes: HorarioFixo[] = [
          { id: uuidv4(), tipo: 'cafe_almoco', horaInicio: '07:00', horaFim: '07:30', descricao: 'Café da Manhã' },
          { id: uuidv4(), tipo: 'almoco', horaInicio: '12:00', horaFim: '13:00', descricao: 'Almoço' },
          { id: uuidv4(), tipo: 'lanche_tarde', horaInicio: '16:00', horaFim: '16:15', descricao: 'Lanche da Tarde' },
          { id: uuidv4(), tipo: 'jantar', horaInicio: '19:00', horaFim: '20:00', descricao: 'Jantar' },
          { id: uuidv4(), tipo: 'sono_inicio', horaInicio: '23:00', descricao: 'Dormir' },
          { id: uuidv4(), tipo: 'sono_fim', horaInicio: '06:00', descricao: 'Acordar' },
        ];
        
        defaultFixedTimes.forEach(time => adicionarHorarioFixo(time));

        const hoje = getDataStringBrasil();

        if (routine && routine.tasks) {
          routine.tasks.forEach((t: any) => {
            const newTask: Task = {
              id: uuidv4(),
              titulo: t.titulo || 'Nova Tarefa',
              descricao: t.descricao || '',
              duracao: t.duracao || 30,
              categoria: t.categoria || 'pessoal',
              prioridade: t.prioridade || 'media',
              status: 'nao_iniciada',
              data: hoje,
              tipoRepeticao: t.tipoRepeticao || 'nenhuma',
              vezAtual: 1,
              xpGanho: false,
              pomodorosFeitos: 0,
            };
            adicionarTask(newTask);
          });
        }

        if (routine && routine.habitos) {
          routine.habitos.forEach((h: any) => {
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
        console.error("Failed to generate routine", error);
        alert("Ocorreu um erro ao gerar sua rotina. Por favor, tente novamente.");
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
            {[1, 2, 3].map(i => (
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
                    <h2 className="text-2xl font-bold mb-6">Passo 3: Metodologias Japonesas</h2>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-text-sec">
                        Hara Hachi Bu (Alimentação)
                        <span className="block text-xs text-text-sec/70 mt-1 font-normal">Comer até estar 80% satisfeito. Como é sua alimentação atual?</span>
                      </label>
                      <textarea name="haraHachiBu" value={formData.haraHachiBu} onChange={handleChange} className="input-modern min-h-[80px] resize-y" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-text-sec">
                        Shokunin (Maestria)
                        <span className="block text-xs text-text-sec/70 mt-1 font-normal">Em que área você busca maestria e dedicação total?</span>
                      </label>
                      <textarea name="shokunin" value={formData.shokunin} onChange={handleChange} className="input-modern min-h-[80px] resize-y" />
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
                {step === 3 ? (
                  <>Finalizar <Sparkles size={18} /></>
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


