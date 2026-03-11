import { GoogleGenAI } from "@google/genai";
import { HealthData, WorkoutPlan, Meta, MetaPeriodo, Task, KPI } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { getDataStringBrasil } from "../utils/dataUtils";
import { addDays, endOfWeek, endOfMonth, endOfQuarter, format } from "date-fns";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
      model: "gemini-3-flash-preview",
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

export async function generateRoutineSuggestion(userProfile: any, answers: any) {
  const prompt = `
    Crie uma rotina de produtividade para o seguinte usuário:
    Nome: ${userProfile.nome}
    Objetivos: ${userProfile.objetivos}
    Rotina Atual: ${userProfile.rotina}
    Hábitos Atuais: ${userProfile.habitosAtuais}
    Horários Disponíveis: ${userProfile.horariosDisponiveis}
    Hora que Acorda: ${userProfile.horaAcordar || '07:00'}
    Hora que Dorme: ${userProfile.horaDormir || '23:00'}
    Filosofia (Shokunin): ${userProfile.shokunin}
    Respostas Extras: ${answers.join(" | ")}

    Gere uma lista de tarefas (tasks) e uma lista de hábitos (habitos) que ajudarão esse usuário a alcançar seus objetivos.
    IMPORTANTE: NÃO inclua tarefas relacionadas a alimentação, refeições (café da manhã, almoço, jantar, lanches). Isso será tratado em um módulo separado.
    
    REGRAS DE HORÁRIOS:
    1. Você SÓ PODE agendar tarefas e hábitos entre a "Hora que Acorda" (${userProfile.horaAcordar || '07:00'}) e a "Hora que Dorme" (${userProfile.horaDormir || '23:00'}).
    2. Não crie tarefas de madrugada se o usuário estiver dormindo.
    3. Considere tempo de deslocamento e pausas naturais.
    4. Reserve pelo menos 1 hora livre no meio do dia para o almoço (mesmo sem criar a tarefa de almoço).
    
    REGRAS DE FREQUÊNCIA PARA TAREFAS:
    1. TAREFAS DIÁRIAS (tipoRepeticao: "diaria"):
       - Apenas hábitos (meditar, exercitar, ler)
       - Tasks muito curtas (< 30 min)
       - Tasks de manutenção diária (ex: "Responder comentários")
       - NUNCA coloque tarefas pesadas ou cansativas aqui (ex: "Editar vídeos", "Trabalhar 10 horas").
    2. TAREFAS SEMANAIS (tipoRepeticao: "semanal" ou "diasSemana" com 1-3 dias):
       - Trabalhos criativos pesados (ex: "Editar vídeo longo")
       - Tarefas que exigem muita energia
       - Exemplo: "Gravar vídeo" (2x por semana), "Postar nas redes" (3x por semana).
    3. TAREFAS QUINZENAIS (tipoRepeticao: "quinzenal"):
       - Projetos grandes e complexos
       - Revisões profundas
       - Limpeza/organização geral
    4. TAREFAS MENSAIS (tipoRepeticao: "mensal"):
       - Planejamento do mês
       - Análise de resultados
       - Tarefas de baixa prioridade

    Para cada task gerada, você DEVE incluir uma "justificativaFrequencia" explicando brevemente por que escolheu essa frequência baseada nas regras acima.

    Se o usuário mencionar eventos que acontecem em dias específicos num período (ex: "Faculdade de 09/03 a 11/07, toda Quinta 08:50 - 11:35"), você DEVE gerar uma task com:
    - tipoRepeticao: "diasSemana"
    - diasSemana: array com os dias (0=Dom, 1=Seg, ..., 6=Sáb)
    - dataInicio: data de início no formato YYYY-MM-DD
    - dataFim: data de fim no formato YYYY-MM-DD
    - horarioInicio: horário de início (HH:mm)
    - horarioFim: horário de fim (HH:mm)
    - duracao: duração em minutos
    
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
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    
    return {
      id: crypto.randomUUID(),
      dataCriacao: new Date().toISOString(),
      dias: parsed.dias || [],
      recomendacoesGerais: parsed.recomendacoesGerais || "Mantenha-se hidratado e respeite seus limites.",
    };
  } catch (error) {
    console.error("Erro ao gerar plano Darebee:", error);
    throw new Error("Falha ao gerar o plano de treino. Tente novamente.");
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
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
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
