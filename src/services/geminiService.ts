import { GoogleGenAI } from "@google/genai";
import { HealthData, WorkoutPlan, Meta, MetaPeriodo, Task, KPI, RoadmapMilestone } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { getDataStringBrasil } from "../utils/dataUtils";
import { addDays, endOfWeek, endOfMonth, endOfQuarter, format } from "date-fns";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateRoadmapLevel(area: string, nivelAtual: number, perfilUsuario: any): Promise<RoadmapMilestone[]> {
  const prompt = `
    Atue como um mentor de desenvolvimento pessoal.
    O usuário está na área de "${area}" e atualmente no nível ${nivelAtual}.
    Crie 4 a 5 marcos (milestones) lógicos e sequenciais para que ele supere este nível e avance para o próximo.
    
    Perfil do Usuário:
    Objetivos: ${perfilUsuario?.objetivos || 'Não informado'}
    Rotina: ${perfilUsuario?.rotina || 'Não informado'}
    
    Regras:
    - Marcos devem ser acionáveis, específicos e mensuráveis.
    - O nível de dificuldade deve ser apropriado para alguém que está no nível ${nivelAtual}.
    - Retorne APENAS um array JSON com a seguinte estrutura:
    [
      {
        "titulo": "string",
        "descricao": "string",
        "pontosXP": number (entre 50 e 200)
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const milestones = JSON.parse(response.text || '[]');
    return milestones.map((m: any) => ({
      ...m,
      id: uuidv4(),
      status: 'pendente'
    }));
  } catch (error) {
    console.error("Erro ao gerar milestones do roadmap:", error);
    throw error;
  }
}

export async function generateDeepeningQuestions(userProfile: any) {
  const prompt = `
    Analise o seguinte perfil de usuário para um sistema de produtividade:
    Nome: ${userProfile.nome}
    Objetivos: ${userProfile.objetivos}
    Rotina Atual: ${userProfile.rotina}
    Hábitos Atuais: ${userProfile.habitosAtuais}
    Horários Disponíveis: ${userProfile.horariosDisponiveis}

    Gere 3 perguntas de aprofundamento para entender melhor como otimizar a rotina dessa pessoa.
    As perguntas devem ser curtas e diretas.
    Retorne apenas as perguntas em formato JSON array de strings.
    Exemplo: ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Erro ao gerar perguntas:", error);
    return [
      "Quais são seus maiores obstáculos para manter a produtividade?",
      "Você prefere trabalhar em blocos longos ou curtos?",
      "Como você lida com interrupções?"
    ];
  }
}

export async function generateRound2Questions(rotina: string) {
  const prompt = `
    Analise a seguinte rotina diária descrita por um usuário:
    "${rotina}"

    Gere 3 perguntas de aprofundamento para entender melhor os detalhes dessa rotina.
    Por exemplo, se o usuário mencionou "edição de vídeo", pergunte sobre o tipo de vídeo, clientes, etc.
    Se mencionou "faculdade", pergunte sobre o curso, horários específicos.
    Se mencionou "exercício", pergunte sobre o tipo, objetivo.

    As perguntas devem ser curtas, diretas e focadas em extrair informações úteis para criar tarefas e metas.
    Retorne APENAS um array JSON de strings com as 3 perguntas.
    Exemplo: ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Erro ao gerar perguntas da rodada 2:", error);
    return [
      "Quais são os principais desafios que você enfrenta nessa rotina?",
      "Quais ferramentas ou métodos você usa atualmente para se organizar?",
      "O que você gostaria de ter mais tempo para fazer?"
    ];
  }
}

export async function generateRound3Questions(rotina: string, round2Answers: {question: string, answer: string}[]) {
  const prompt = `
    Analise a rotina do usuário e suas respostas de aprofundamento:
    Rotina: "${rotina}"
    Respostas de aprofundamento:
    ${round2Answers.map(a => `- ${a.question}: ${a.answer}`).join('\n')}

    Gere 3 perguntas focadas em Metas e Objetivos para os próximos 3 meses, baseadas no que o usuário faz.
    Por exemplo, se ele edita vídeos, pergunte quantos vídeos quer ter postado ou qual a meta de inscritos.
    Se ele estuda, pergunte qual a meta de notas ou projetos.

    As perguntas devem ser curtas, diretas e focadas em definir KPIs e Metas claras.
    Retorne APENAS um array JSON de strings com as 3 perguntas.
    Exemplo: ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Erro ao gerar perguntas da rodada 3:", error);
    return [
      "Onde você quer estar daqui a 3 meses em relação aos seus projetos principais?",
      "Qual seria uma meta quantitativa (número) que indicaria sucesso para você nesse período?",
      "Qual o principal hábito que você precisa construir para alcançar essas metas?"
    ];
  }
}

export async function generateRoutineSuggestion(userProfile: any, round2Answers: {question: string, answer: string}[], round3Answers: {question: string, answer: string}[]) {
  const prompt = `
    Atue como "O Arquiteto", um especialista em produtividade.
    Crie uma rotina de produtividade para o seguinte usuário:
    Nome: ${userProfile.nome}
    
    HORÁRIOS FIXOS INFORMADOS:
    - Hora que Acorda: ${userProfile.horaAcordar || '07:00'}
    - Hora que Dorme: ${userProfile.horaDormir || '23:00'}
    - Preferência de Blocos: ${userProfile.preferenciaBlocos || 'misturado'}
    
    DESCRIÇÃO DA ROTINA (Texto Livre):
    "${userProfile.rotina}"

    DETALHES DE APROFUNDAMENTO:
    ${round2Answers.map(a => `- P: ${a.question}\n  R: ${a.answer}`).join('\n')}

    METAS PARA 3 MESES:
    ${round3Answers.map(a => `- P: ${a.question}\n  R: ${a.answer}`).join('\n')}

    SUA MISSÃO:
    Analise o texto livre da rotina e extraia/crie as tarefas e hábitos necessários.
    
    VOCÊ DEVE ENTENDER E EXTRAIR:
    1. Horário que acorda e dorme (se mencionado no texto, use para ajustar, mas respeite os horários fixos como base).
    2. Atividades fixas (trabalho, aula, etc) com seus respectivos horários.
    3. Atividades com dias específicos (ex: "aula de programação só nas terças e quintas").
    4. Tempo disponível/desejado para cada atividade (ex: "quero reservar 240min pra edição").
    5. Prazos e datas importantes (ex: "semestre vai até 15 de julho").

    Gere uma lista de tarefas (tasks) e uma lista de hábitos (habitos) que ajudarão esse usuário a organizar seu dia.
    
    REGRAS DE PREENCHIMENTO DA AGENDA (MUITO IMPORTANTE):
    1. Você DEVE criar uma escala COMPLETA para um dia típico (ou dias específicos), preenchendo TODOS os horários desde a "Hora que Acorda" até a "Hora que Dorme".
    2. NÃO DEIXE BURACOS na agenda. Cada minuto do dia deve estar alocado em alguma tarefa.
    3. Ordem de prioridade para alocação:
       - 1º: Horários fixos (trabalho, aula, etc) - PRIORIDADE MÁXIMA.
       - 2º: Refeições (café da manhã, almoço, jantar).
       - 3º: Atividades programadas (exercício, estudo, edição, etc).
       - 4º: Preencha TODOS os espaços vazios que sobrarem com "Tempo Livre", "Lazer" ou "Descanso".
    4. Toda tarefa gerada DEVE ter "horarioInicio" e "horarioFim" definidos (formato HH:mm).
    5. A soma das durações e a sequência de horários devem ser contínuas.
    
    REGRAS DE BLOCOS DE TEMPO (MUITO IMPORTANTE):
    O usuário escolheu a preferência de blocos: "${userProfile.preferenciaBlocos || 'misturado'}".
    - Se "curto": Separe tarefas longas (estudo, edição, trabalho focado) em blocos de 30 minutos (ideal para Pomodoro). Ex: "Editar vídeo (30min)".
    - Se "longo": Agrupe tarefas em blocos de 60 a 90 minutos (para trabalho profundo). Ex: "Editar vídeo (90min)".
    - Se "misturado": Você decide a melhor duração baseada no tipo de tarefa.
    - EXCEÇÕES (SEMPRE SEGUEM SEU PRÓPRIO TEMPO, NÃO DIVIDIR): Atividades de horário fixo (aula, trabalho formal), acordar, dormir, refeições, rotina matinal/noturna.
    - O título da tarefa DEVE incluir a duração em parênteses no final. Ex: "Estudar React (30min)" ou "Trabalho Focado (90min)".
    
    REGRAS DE FREQUÊNCIA PARA TAREFAS:
    1. TAREFAS DIÁRIAS (tipoRepeticao: "diaria"):
       - Apenas hábitos (meditar, exercitar, ler)
       - Tasks muito curtas (< 30 min)
       - Tasks de manutenção diária, refeições, tempo livre.
    2. TAREFAS SEMANAIS (tipoRepeticao: "semanal" ou "diasSemana"):
       - Trabalhos criativos pesados
       - Aulas ou compromissos fixos em dias específicos
    3. TAREFAS QUINZENAIS/MENSAIS:
       - Planejamentos, revisões profundas.

    Para cada task gerada, você DEVE incluir uma "justificativaFrequencia" explicando brevemente por que escolheu essa frequência baseada nas regras acima e no texto do usuário.

    Se o usuário mencionar eventos que acontecem em dias específicos num período (ex: "Faculdade até 15 de julho, toda Quinta 18:30 - 22:30"), você DEVE gerar uma task com:
    - tipoRepeticao: "diasSemana"
    - diasSemana: array com os dias (0=Dom, 1=Seg, ..., 6=Sáb)
    - dataInicio: data de início no formato YYYY-MM-DD (use a data atual se não especificado)
    - dataFim: data de fim no formato YYYY-MM-DD (se especificado)
    - horarioInicio: horário de início (HH:mm)
    - horarioFim: horário de fim (HH:mm)
    - duracao: duração em minutos
    
    PLANO DE 3 MESES (90 DIAS):
    Baseado nas respostas de Metas para 3 meses, gere um plano trimestral estruturado.
    - objetivoPrincipal: Resumo do objetivo principal para os próximos 3 meses.
    - metaTrimestral: A grande meta para 90 dias.
    - metasMensais: 3 metas (uma para cada mês) que dividem a meta trimestral.
    - metasSemanais: 4 metas (uma para cada semana do primeiro mês) que dividem a primeira meta mensal.
    - kpis: 1 a 3 Indicadores-Chave de Performance para acompanhar o progresso (ex: "Vídeos publicados", "Kg perdidos").
    
    Retorne APENAS um objeto JSON com a seguinte estrutura:
    {
      "tasks": [
        {
          "titulo": "string",
          "descricao": "string",
          "duracao": number (em minutos),
          "horarioInicio": "HH:mm" (opcional),
          "horarioFim": "HH:mm" (opcional),
          "categoria": "trabalho" | "pessoal" | "saude" | "estudos",
          "prioridade": "alta" | "media" | "baixa",
          "tipoRepeticao": "nenhuma" | "diaria" | "diasSemana" | "semanal" | "quinzenal" | "mensal",
          "justificativaFrequencia": "string (explicando a escolha da frequência)",
          "diasSemana": [0, 1, 2, 3, 4, 5, 6] (opcional, apenas se tipoRepeticao for diasSemana),
          "dataInicio": "YYYY-MM-DD" (opcional, início do período),
          "dataFim": "YYYY-MM-DD" (opcional, fim do período)
        }
      ],
      "habitos": [
        {
          "nome": "string",
          "categoria": "string",
          "diasSemana": [0, 1, 2, 3, 4, 5, 6] (array de números, 0=domingo, 6=sábado),
          "horario": "HH:mm"
        }
      ],
      "planoTrimestral": {
        "objetivoPrincipal": "string",
        "metaTrimestral": { "titulo": "string", "descricao": "string" },
        "metasMensais": [
          { "titulo": "string", "descricao": "string" }
        ],
        "metasSemanais": [
          { "titulo": "string", "descricao": "string" }
        ],
        "kpis": [
          { "titulo": "string", "unidade": "string", "valorMeta": number }
        ]
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '{"tasks":[], "habitos":[]}');
  } catch (error) {
    console.error("Erro ao gerar rotina:", error);
    throw error;
  }
}

export async function generateHaraHachiBuMeals(healthData: HealthData, userProfile: any): Promise<any[]> {
  const prompt = `
    Atue como um nutricionista especialista na filosofia Hara Hachi Bu (comer até 80% da capacidade).
    Gere 3 OPÇÕES DE REFEIÇÕES DIÁRIAS (Opção 1, Opção 2, Opção 3) para o usuário.
    
    Dados do usuário:
    - Peso: ${healthData.peso} kg
    - Altura: ${healthData.altura} cm
    - Idade: ${healthData.idade} anos
    - Gênero: ${healthData.genero}
    - Nível de Atividade: ${healthData.nivelAtividade}
    - Objetivo: ${healthData.objetivo}
    - Condições Médicas/Restrições: ${healthData.condicoesMedicas || 'Nenhuma'}
    - Preferências alimentares: ${userProfile?.haraHachiBu || 'Nenhuma informada'}

    Cada opção deve conter 4 refeições: cafeDaManha, almoco, lancheDaTarde, jantar.
    Para cada refeição, forneça:
    - nome: Nome do prato
    - quantidade: Quantidade em gramas ou ml (ex: "200g")
    - porcoes: Medida caseira (ex: "2 fatias", "1 escumadeira")
    - calorias: Calorias aproximadas (número)
    - proteina: Gramas de proteína (número)
    - carboidratos: Gramas de carboidrato (número)
    - gorduras: Gramas de gordura (número)

    Calcule as calorias totais de cada opção com base no objetivo do usuário, aplicando um leve déficit se o objetivo for perder peso, ou superávit se for ganhar massa. Lembre-se do princípio Hara Hachi Bu (porções moderadas que saciam 80%).

    Retorne APENAS um array JSON com a seguinte estrutura:
    [
      {
        "cafeDaManha": { "nome": "", "quantidade": "", "porcoes": "", "calorias": 0, "proteina": 0, "carboidratos": 0, "gorduras": 0 },
        "almoco": { ... },
        "lancheDaTarde": { ... },
        "jantar": { ... },
        "caloriasTotais": 0
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const opcoes = JSON.parse(response.text || '[]');
    return opcoes.map((op: any) => ({
      ...op,
      id: uuidv4()
    }));
  } catch (error) {
    console.error("Erro ao gerar refeições Hara Hachi Bu:", error);
    throw error;
  }
}
export async function generateKPIs(userProfile: any, habitos: any[], metas: Meta[]): Promise<any[]> {
  const prompt = `
    Analise o perfil do usuário, seus hábitos e metas atuais para sugerir 3 a 5 KPIs (Key Performance Indicators) relevantes.

    Perfil:
    Objetivos: ${userProfile?.objetivos || 'Não informado'}
    Rotina: ${userProfile?.rotina || 'Não informado'}

    Hábitos que deseja desenvolver:
    ${habitos.map(h => `- ${h.nome}`).join('\n') || 'Nenhum hábito cadastrado'}

    Metas atuais:
    ${metas.map(m => `- ${m.titulo} (${m.periodo})`).join('\n') || 'Nenhuma meta cadastrada'}

    Gere KPIs que sejam mensuráveis, específicos e relevantes para este contexto.
    
    Retorne APENAS um array JSON com a seguinte estrutura:
    [
      {
        "titulo": "string (ex: Horas de estudo por semana)",
        "valorMeta": number (ex: 10),
        "unidade": "string (ex: horas, dias, %, kg, páginas)",
        "descricao": "string (Sugestão de como medir e por que é importante)",
        "frequencia": "diario" | "semanal" | "mensal"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const kpis = JSON.parse(response.text || '[]');
    return kpis.map((k: any) => ({
      ...k,
      id: uuidv4(),
      valorAtual: 0,
      tipoCalculo: 'manual',
      frequencia: k.frequencia || 'semanal',
      dataInicio: getDataStringBrasil(),
      historico: []
    }));
  } catch (error) {
    console.error("Erro ao gerar KPIs:", error);
    throw error;
  }
}
export async function generateDarebeePlan(healthData: HealthData): Promise<WorkoutPlan> {
  const prompt = `
    Atue como um personal trainer especialista na metodologia Darebee (www.darebee.com).
    Crie um plano de treino semanal (7 dias) personalizado baseado nos seguintes dados do usuário:
    
    - Peso: ${healthData.peso} kg
    - Altura: ${healthData.altura} cm
    - Idade: ${healthData.idade} anos
    - Gênero: ${healthData.genero}
    - Nível de Atividade: ${healthData.nivelAtividade}
    - Objetivo: ${healthData.objetivo}
    - Equipamentos Disponíveis: ${healthData.equipamentos}
    - Dias Disponíveis para Treino: ${healthData.diasTreino}
    - Tempo Disponível por Dia: ${healthData.tempoPorDia} minutos
    - Condições Médicas: ${healthData.condicoesMedicas || 'Nenhuma'}

    Regras da Metodologia Darebee:
    - Foco em exercícios com peso corporal (se equipamentos = 'nenhum').
    - Treinos estruturados em circuitos ou séries.
    - Nomes de exercícios claros e comuns no Darebee (ex: Push-ups, Squats, Jumping Jacks, Plank).
    - Incluir dias de descanso ativo ou recuperação se o usuário não treinar os 7 dias.
    - O número de dias de treino com exercícios deve ser exatamente igual a ${healthData.diasTreino}. Os outros dias devem ser marcados como "Descanso".

    Retorne APENAS um objeto JSON com a seguinte estrutura exata:
    {
      "recomendacoesGerais": "string (dicas gerais de hidratação, postura, etc)",
      "dias": [
        {
          "dia": number (1 a 7),
          "foco": "string (ex: Upper Body, Full Body, Cardio, Descanso)",
          "exercicios": [
            {
              "nome": "string (nome do exercício)",
              "series": number (quantidade de séries),
              "repeticoes": "string (ex: '10-12', '30s', 'Ate a falha')",
              "descanso": "string (ex: '60s', 'Sem descanso')",
              "instrucoes": "string (dica rápida de execução)"
            }
          ]
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    
    return {
      id: crypto.randomUUID(),
      dataCriacao: getDataStringBrasil(),
      dias: parsed.dias || [],
      recomendacoesGerais: parsed.recomendacoesGerais || "Mantenha-se hidratado e respeite seus limites.",
    };
  } catch (error) {
    console.error("Erro ao gerar plano Darebee:", error);
    throw new Error("Falha ao gerar o plano de treino. Tente novamente.");
  }
}

export async function generateHabitos(userProfile: any, habitosAtuais: any[]): Promise<any[]> {
  const prompt = `
    Atue como um especialista em produtividade e formação de hábitos.
    O usuário precisa de sugestões de novos hábitos para melhorar sua rotina.

    Dados do usuário:
    - Objetivos: ${userProfile?.objetivos || 'Não informado'}
    - Rotina Atual: ${userProfile?.rotina || 'Não informado'}
    - Horários Disponíveis: ${userProfile?.horariosDisponiveis || 'Não informado'}
    - Hábitos que já possui: ${habitosAtuais.map(h => h.nome).join(', ') || 'Nenhum'}

    Gere 3 a 5 sugestões de hábitos personalizados que ajudarão o usuário a alcançar seus objetivos.
    NÃO sugira hábitos que o usuário já possui.

    Retorne APENAS um array JSON com a seguinte estrutura:
    [
      {
        "nome": "string (ex: Meditar 10 min)",
        "frequencia": "diaria" | "dias_especificos",
        "diasSemana": [0, 1, 2, 3, 4, 5, 6] (opcional, apenas se frequencia for dias_especificos),
        "horario": "string (ex: Manhã, Tarde, Noite, ou um horário específico HH:mm)",
        "duracaoEstimada": number (em minutos),
        "categoria": "saude" | "estudo" | "trabalho" | "pessoal",
        "beneficio": "string (Por que este hábito ajuda o usuário?)"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const habitos = JSON.parse(response.text || '[]');
    return habitos.map((h: any) => ({
      ...h,
      id: uuidv4()
    }));
  } catch (error) {
    console.error("Erro ao gerar hábitos:", error);
    throw error;
  }
}

export async function generateMetas(userProfile: any, tasks: Task[] = [], kpis: KPI[] = []): Promise<Meta[]> {
  const tasksList = tasks.map(t => `- ID: ${t.id} | Título: ${t.titulo}`).join('\n');
  const kpisList = kpis.map(k => `- ID: ${k.id} | Título: ${k.titulo}`).join('\n');

  const prompt = `
    Crie 9 metas para o usuário baseado no seu perfil:
    Nome: ${userProfile?.nome || 'Usuário'}
    Objetivos: ${userProfile?.objetivos || 'Melhorar produtividade e saúde'}
    Rotina Atual: ${userProfile?.rotina || 'Ocupada'}

    Tasks Existentes:
    ${tasksList || 'Nenhuma task existente.'}

    KPIs Existentes:
    ${kpisList || 'Nenhum KPI existente.'}

    Você deve gerar exatamente:
    - 3 metas SEMANAIS (curto prazo, acionáveis)
    - 3 metas MENSAIS (médio prazo, requerem consistência)
    - 3 metas TRIMESTRAIS (longo prazo, grandes marcos)

    IMPORTANTE: Toda meta DEVE estar vinculada a uma Task ou a um KPI.
    Você pode vincular a uma Task ou KPI existente retornando o ID correspondente em "vinculoExistente".
    Se não houver uma Task ou KPI existente que faça sentido, você DEVE sugerir a criação de um novo em "sugestaoVinculo".
    
    Retorne APENAS um objeto JSON com a seguinte estrutura:
    {
      "metas": [
        {
          "titulo": "string",
          "descricao": "string",
          "periodo": "semanal" | "mensal" | "trimestral",
          "metaProgresso": number (valor alvo, ex: 100 para 100%, 10 para 10 livros, etc),
          "vinculoExistente": {
            "tipo": "task" | "kpi",
            "id": "string (ID da task ou kpi existente)"
          },
          "sugestaoVinculo": {
            "tipo": "task" | "kpi",
            "titulo": "string (título da nova task ou kpi a ser criado)",
            "descricao": "string (descrição ou unidade do kpi)"
          }
        }
      ]
    }
    NOTA: Use "vinculoExistente" OU "sugestaoVinculo", não ambos.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text || '{"metas":[]}');
    const hoje = new Date();
    
    return parsed.metas.map((m: any) => {
      let dataFim = hoje;
      if (m.periodo === 'semanal') dataFim = endOfWeek(hoje, { weekStartsOn: 1 });
      if (m.periodo === 'mensal') dataFim = endOfMonth(hoje);
      if (m.periodo === 'trimestral') dataFim = endOfQuarter(hoje);

      return {
        id: uuidv4(),
        titulo: m.titulo,
        descricao: m.descricao,
        periodo: m.periodo as MetaPeriodo,
        dataInicio: getDataStringBrasil(),
        dataFim: format(dataFim, 'yyyy-MM-dd'),
        progresso: 0,
        status: 'nao_iniciada',
        metaProgresso: m.metaProgresso || 100,
        tasksVinculadas: [],
        ehIkigai: false,
        ehShokunin: false,
        vinculoExistente: m.vinculoExistente,
        sugestaoVinculo: m.sugestaoVinculo
      } as Meta & { sugestaoVinculo?: any, vinculoExistente?: any };
    });
  } catch (error) {
    console.error("Erro ao gerar metas:", error);
    return [];
  }
}

export async function generateHarderMeta(metaAnterior: Meta, userProfile: any): Promise<Meta> {
  const prompt = `
    O usuário concluiu a seguinte meta:
    Título: ${metaAnterior.titulo}
    Descrição: ${metaAnterior.descricao}
    Período: ${metaAnterior.periodo}
    Valor Alvo: ${metaAnterior.metaProgresso}

    Perfil do usuário:
    Objetivos: ${userProfile?.objetivos || ''}

    Crie uma NOVA meta do mesmo período ('${metaAnterior.periodo}') que seja uma progressão natural (Kaizen) da meta anterior.
    A nova meta deve ser cerca de 10% a 20% mais difícil ou abrangente.

    Retorne APENAS um objeto JSON com a seguinte estrutura:
    {
      "titulo": "string",
      "descricao": "string",
      "metaProgresso": number (valor alvo maior que o anterior)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const m = JSON.parse(response.text || '{}');
    const hoje = new Date();
    
    let dataFim = hoje;
    if (metaAnterior.periodo === 'semanal') dataFim = endOfWeek(hoje, { weekStartsOn: 1 });
    if (metaAnterior.periodo === 'mensal') dataFim = endOfMonth(hoje);
    if (metaAnterior.periodo === 'trimestral') dataFim = endOfQuarter(hoje);

    return {
      id: uuidv4(),
      titulo: m.titulo || `Evolução: ${metaAnterior.titulo}`,
      descricao: m.descricao || 'Meta gerada automaticamente por progressão.',
      periodo: metaAnterior.periodo,
      dataInicio: getDataStringBrasil(),
      dataFim: format(dataFim, 'yyyy-MM-dd'),
      progresso: 0,
      status: 'nao_iniciada',
      metaProgresso: m.metaProgresso || Math.round(metaAnterior.metaProgresso! * 1.1),
      tasksVinculadas: [],
      ehIkigai: false,
      ehShokunin: false,
    };
  } catch (error) {
    console.error("Erro ao gerar meta mais difícil:", error);
    
    // Fallback
    const hoje = new Date();
    let dataFim = hoje;
    if (metaAnterior.periodo === 'semanal') dataFim = endOfWeek(hoje, { weekStartsOn: 1 });
    if (metaAnterior.periodo === 'mensal') dataFim = endOfMonth(hoje);
    if (metaAnterior.periodo === 'trimestral') dataFim = endOfQuarter(hoje);

    return {
      id: uuidv4(),
      titulo: `${metaAnterior.titulo} (Nível 2)`,
      descricao: 'Continue progredindo!',
      periodo: metaAnterior.periodo,
      dataInicio: getDataStringBrasil(),
      dataFim: format(dataFim, 'yyyy-MM-dd'),
      progresso: 0,
      status: 'nao_iniciada',
      metaProgresso: Math.round(metaAnterior.metaProgresso! * 1.1),
      tasksVinculadas: [],
      ehIkigai: false,
      ehShokunin: false,
    };
  }
}

export async function generateTasksFromDescription(description: string, context: { tasks: Task[], metas: Meta[], userProfile: any }) {
  const { tasks, metas, userProfile } = context;
  
  const tasksContext = tasks.slice(-10).map(t => `- ${t.titulo} (${t.status})`).join('\n');
  const metasContext = metas.filter(m => m.status !== 'concluida').map(m => `- ${m.titulo} (${m.periodo})`).join('\n');

  const prompt = `
    Atue como um assistente de produtividade inteligente. O usuário descreveu o que fez ou o que planeja fazer:
    "${description}"

    CONTEXTO DO USUÁRIO:
    - Objetivos: ${userProfile?.objetivos || 'Não informado'}
    - Metas Atuais:
    ${metasContext || 'Nenhuma meta ativa'}
    - Tarefas Recentes:
    ${tasksContext || 'Nenhuma tarefa recente'}

    SUA MISSÃO:
    1. Analise o texto do usuário.
    2. Se ele terminou algo, sugira o PRÓXIMO PASSO lógico (跟进).
    3. Se ele vai começar algo novo, quebre esse projeto em tarefas acionáveis (máximo 5 tarefas).
    4. Identifique se alguma tarefa deve ser RECORRENTE (diária ou semanal).
    5. Tente vincular as novas tarefas a METAS existentes se fizer sentido.

    REGRAS PARA AS TAREFAS:
    - Títulos claros e acionáveis (começando com verbo no infinitivo).
    - Duração estimada realista em minutos.
    - Categoria apropriada.
    - Prioridade baseada na urgência/importância.

    Retorne APENAS um objeto JSON com a seguinte estrutura:
    {
      "tasks": [
        {
          "titulo": "string",
          "descricao": "string",
          "duracao": number (em minutos),
          "categoria": "trabalho" | "pessoal" | "saude" | "estudos",
          "prioridade": "alta" | "media" | "baixa",
          "tipoRepeticao": "nenhuma" | "diaria" | "semanal",
          "metaVinculada": "string (ID da meta existente se houver vínculo claro)"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text || '{"tasks":[]}');
    return parsed.tasks.map((t: any) => ({
      ...t,
      id: uuidv4(),
      status: 'nao_iniciada',
      data: getDataStringBrasil(),
      xpGanho: false,
      pomodorosFeitos: 0,
      vezAtual: 1
    }));
  } catch (error) {
    console.error("Erro ao gerar tasks por descrição:", error);
    return [];
  }
}
