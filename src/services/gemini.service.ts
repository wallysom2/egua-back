import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AnaliseResultado {
  aprovado: boolean;
  feedback: string;
  pontuacao: number;
  sugestoes: string[];
}

export async function analisarRespostaProgramacao(
  enunciado: string,
  resposta: string,
  exemploResposta?: string,
): Promise<AnaliseResultado> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = construirPromptAnalise(enunciado, resposta, exemploResposta);

    logger.info('Enviando análise para Gemini', {
      enunciado: enunciado.substring(0, 100),
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse da resposta estruturada do Gemini
    const analise = parseResposta(text);

    logger.info('Análise concluída', {
      aprovado: analise.aprovado,
      pontuacao: analise.pontuacao,
    });

    return analise;
  } catch (error) {
    logger.error('Erro na análise do Gemini', error);
    throw new Error('Falha na análise da resposta');
  }
}

function construirPromptAnalise(
  enunciado: string,
  resposta: string,
  exemploResposta?: string,
): string {
  let prompt = `
Você é um professor de programação especializado em avaliar códigos de estudantes.

ENUNCIADO DO EXERCÍCIO:
${enunciado}

RESPOSTA DO ESTUDANTE:
${resposta}

${exemploResposta ? `EXEMPLO DE RESPOSTA ESPERADA:\n${exemploResposta}\n` : ''}

INSTRUÇÕES PARA ANÁLISE:
1. Analise se o código resolve o problema proposto
2. Verifique a sintaxe e lógica
3. Considere boas práticas de programação
4. Identifique pontos de melhoria
5. Dê uma pontuação de 0 a 100

FORMATO DA RESPOSTA (OBRIGATÓRIO):
Retorne APENAS um JSON válido no seguinte formato:
{
  "aprovado": boolean,
  "feedback": "string com feedback detalhado",
  "pontuacao": number (0-100),
  "sugestoes": ["array", "de", "sugestões", "de", "melhoria"]
}

IMPORTANTE: Sua resposta deve ser APENAS o JSON, sem texto adicional antes ou depois.`;

  return prompt;
}

function parseResposta(texto: string): AnaliseResultado {
  try {
    // Remove possível texto antes/depois do JSON
    const jsonMatch = texto.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON não encontrado na resposta');
    }

    const json = JSON.parse(jsonMatch[0]);

    return {
      aprovado: Boolean(json.aprovado),
      feedback: String(json.feedback || 'Sem feedback disponível'),
      pontuacao: Number(json.pontuacao || 0),
      sugestoes: Array.isArray(json.sugestoes) ? json.sugestoes : [],
    };
  } catch (error) {
    logger.error('Erro ao parsear resposta do Gemini', { texto, error });

    // Fallback: análise básica se parsing falhar
    return {
      aprovado: false,
      feedback:
        'Erro na análise automática. Resposta será revisada manualmente.',
      pontuacao: 0,
      sugestoes: ['Revisar sintaxe', 'Verificar lógica'],
    };
  }
}
