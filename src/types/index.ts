export type TaskStatus = 'nao_iniciada' | 'em_andamento' | 'concluida' | 'cancelada' | 'nao_feita' | 'adiada' | 'atrasada';
export type TaskCategoria = 'trabalho' | 'pessoal' | 'saude' | 'estudos';
export type TaskPrioridade = 'alta' | 'media' | 'baixa';
export type TipoRepeticao = 'nenhuma' | 'diaria' | 'diasSemana' | 'semanal' | 'mensal';

export interface Task {
  id: string;
  titulo: string;
  descricao?: string;
  duracao: number; // em minutos
  categoria: TaskCategoria;
  prioridade: TaskPrioridade;
  status: TaskStatus;
  data: string; // YYYY-MM-DD
  prazo?: string; // YYYY-MM-DD
  tipoRepeticao: TipoRepeticao;
  dataLimite?: string; // YYYY-MM-DD
  horario?: string; // HH:mm
  diasSemana?: number[]; // [0,1,2,3,4,5,6]
  vezAtual: number;
  vezesConcluida?: number;
  repeticoesMax?: number;
  concluidaDefinitivamente?: boolean;
  dataConclusaoDefinitiva?: string;
  kpiVinculado?: string;
  metaVinculada?: string;
  xpGanho: boolean;
  horarioFixo?: boolean;
  horarioFixoId?: string;
  deadline?: string; // YYYY-MM-DD
  pomodorosFeitos: number;
  blocosQuebrados?: string[];
  vezesAdiada?: number;
}

export interface ConclusaoHabito {
  data: string; // YYYY-MM-DD
  concluido: boolean;
}

export interface Habito {
  id: string;
  nome: string;
  diasSemana: number[]; // [0,1,2,3,4,5,6]
  horario?: string; // HH:mm
  categoria: string;
  conclusoes: ConclusaoHabito[];
  streak: number;
  ultimoCumprimento?: string; // YYYY-MM-DD
}

export type MetaPeriodo = 'semanal' | 'mensal' | 'trimestral';
export type MetaStatus = 'nao_iniciada' | 'em_andamento' | 'concluida';

export interface Meta {
  id: string;
  titulo: string;
  descricao?: string;
  periodo: MetaPeriodo;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD (Target date set by user)
  deadline?: string; // YYYY-MM-DD (Hard deadline: creation + 7/30/90 days)
  dataConclusao?: string; // YYYY-MM-DD
  progresso: number; // 0-100
  status: MetaStatus;
  arquivada?: boolean;
  resultado?: 'sucesso' | 'falha';
  kpiVinculado?: string;
  metaProgresso?: number;
  tasksVinculadas: string[];
  ehIkigai: boolean;
  ehShokunin: boolean;
}

export interface KPI {
  id: string;
  titulo: string;
  descricao?: string;
  valorAtual: number;
  valorMeta: number;
  unidade: string;
  tipoCalculo: 'manual' | 'automatico';
  tipoAutomatico?: 'tasks_concluidas' | 'habitos_concluidos' | 'pomodoro_tempo' | 'xp_ganho' | 'streak_atual';
  frequencia: 'diario' | 'semanal' | 'mensal';
  dataInicio: string;
  historico: { data: string; valor: number }[];
}

export type TipoHorarioFixo = 'cafe_almoco' | 'almoco' | 'lanche_tarde' | 'jantar' | 'sono_inicio' | 'sono_fim' | 'outro';

export interface HorarioFixo {
  id: string;
  tipo: TipoHorarioFixo;
  horaInicio: string; // HH:mm
  horaFim?: string; // HH:mm
  descricao: string;
}

export interface Configuracao {
  timezone: string;
  duracaoPomodoro: number;
  pomodorosAntesPause: number;
  duracaoPausaCurta: number;
  duracaoPausaLonga: number;
  limiteKanban: number;
  onboardingCompleted: boolean;
  tema?: string;
}

export interface Ikigai {
  paixoes: string[];
  profissoes: string[];
  missoes: string[];
  vocacoes: string[];
}

export interface Kaizen {
  id: string;
  data: string;
  melhoria: string;
  tipo: 'diario' | 'semanal';
}

export interface UserProfile {
  nome: string;
  dataNascimento: string;
  expectativaVida: number;
  objetivos: string;
  rotina: string;
  habitosAtuais: string;
  horariosDisponiveis: string;
  haraHachiBu: string;
  shokunin: string;
}

export interface HealthData {
  peso: number;
  altura: number;
  idade: number;
  genero: string;
  nivelAtividade: 'sedentario' | 'pouco_ativo' | 'ativo' | 'muito_ativo';
  objetivo: 'perder_peso' | 'ganhar_musculo' | 'manter_peso' | 'condicionamento';
  equipamentos: 'nenhum' | 'halteres' | 'elasticos' | 'academia_completa';
  diasTreino: number;
  tempoPorDia: number;
  condicoesMedicas?: string;
}

export interface Exercise {
  nome: string;
  series: number;
  repeticoes: string; // Ex: "10-12", "30s"
  descanso: string; // Ex: "60s"
  instrucoes: string;
}

export interface WorkoutDay {
  dia: number; // 1 to 7
  foco: string; // Ex: "Upper Body", "Cardio", "Rest"
  exercicios: Exercise[];
}

export interface WorkoutPlan {
  id: string;
  dataCriacao: string;
  dias: WorkoutDay[];
  recomendacoesGerais: string;
}

export interface GamificationState {
  totalXP: number;
  xpDiario: number;
  badges: string[];
  streakDias: number;
  ultimoAcesso: string;
  moedas: number;
  historicoMoedas: TransacaoMoeda[];
  moedasAcumuladasAno: number;
  recompensasCompradas: RecompensaComprada[];
}

export interface TransacaoMoeda {
  id: string;
  data: string;
  quantidade: number;
  descricao: string;
  tipo: 'ganho' | 'gasto';
}

export type TipoRecompensa = 'diaria' | 'semanal' | 'anual';

export interface Recompensa {
  id: string;
  titulo: string;
  custo: number;
  tipo: TipoRecompensa;
  descricao: string;
  icone: string;
}

export interface RecompensaComprada {
  id: string;
  recompensaId: string;
  dataCompra: string;
  usada: boolean;
  dataUso?: string;
}

export interface BadgeInfo {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
}

export interface Meal {
  nome: string;
  quantidade: string;
  porcoes: string;
  calorias: number;
  proteina: number;
  carboidratos: number;
  gorduras: number;
}

export interface MealOption {
  id: string;
  cafeDaManha: Meal;
  almoco: Meal;
  lancheDaTarde: Meal;
  jantar: Meal;
  caloriasTotais: number;
}

export interface DailyMeals {
  data: string; // YYYY-MM-DD
  opcoesGeradas: MealOption[];
  opcaoEscolhidaId?: string;
}

export interface NutritionProfile {
  peso: number;
  altura: number;
  idade: number;
  genero: 'masculino' | 'feminino';
  nivelAtividade: 'sedentario' | 'leve' | 'moderado' | 'ativo' | 'muito_ativo';
  objetivo: 'perder_peso' | 'manter' | 'ganhar_musculo';
  restricoesAlimentares: string[];
  preferencias: string;
  naoGosta: string;
  refeicoesPorDia: 3 | 4 | 5 | 6;
  horariosRefeicoes: string;
  metaCaloricaPersonalizada?: number;
}

export interface MealItem {
  nome: string; // "Café da Manhã", "Almoço", etc.
  horario: string;
  prato: string;
  ingredientes: string[];
  quantidadeGramas: number;
  calorias: number;
  macros: {
    proteina: number;
    carboidratos: number;
    gorduras: number;
  };
}

export interface NutritionPlan {
  tmb: number;
  get: number;
  caloriasMeta: number;
  macrosMeta: {
    proteina: number;
    carboidratos: number;
    gorduras: number;
  };
  refeicoes: MealItem[];
  dicasHaraHachiBu: string[];
}
