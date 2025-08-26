import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AnaliseResultado {
  aprovado: boolean;
  feedback: string;
  pontuacao: number;
  sugestoes: string[];
}

export interface MensagemPersonalizada {
  mensagem: string;
  tom: 'parabenizacao' | 'orientacao';
}

export async function analisarRespostaProgramacao(
  enunciado: string,
  resposta: string,
  exemploResposta?: string,
): Promise<AnaliseResultado> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

export async function gerarMensagemPersonalizadaIdoso(
  aprovado: boolean,
  feedback: string,
  enunciado: string,
  resposta: string,
): Promise<MensagemPersonalizada> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = construirPromptMensagemIdoso(aprovado, feedback, enunciado, resposta);

    logger.info('Gerando mensagem personalizada para idoso', {
      aprovado,
      enunciado: enunciado.substring(0, 50),
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const mensagem = parseMensagemPersonalizada(text);

    logger.info('Mensagem personalizada gerada', {
      tom: mensagem.tom,
      tamanho: mensagem.mensagem.length,
    });

    return mensagem;
  } catch (error) {
    logger.error('Erro ao gerar mensagem personalizada', error);
    
    // Fallback: mensagem padrão baseada no resultado
    return {
      mensagem: aprovado 
        ? "Parabéns! Você acertou o exercício. Continue assim, você está indo muito bem!" 
        : "Não desanime! Vamos tentar novamente. Revise o conteúdo e tente uma abordagem diferente.",
      tom: aprovado ? 'parabenizacao' : 'orientacao'
    };
  }
}

function construirPromptMensagemIdoso(
  aprovado: boolean,
  feedback: string,
  enunciado: string,
  resposta: string,
): string {
  const prompt = `
Você é um professor especializado em ensinar programação para idosos de forma carinhosa e paciente.

CONTEXTO:
- O aluno é uma pessoa idosa aprendendo programação
- ${aprovado ? 'A resposta está CORRETA' : 'A resposta está INCORRETA'}
- Exercício: ${enunciado}
- Resposta do aluno: ${resposta}
- Análise técnica: ${feedback}

INSTRUÇÕES:
1. Use linguagem simples, carinhosa e encorajadora
2. Evite termos técnicos complexos
3. ${aprovado ? 'PARABENIZE o aluno pelo acerto de forma calorosa' : 'DÊ ORIENTAÇÃO sucinta sobre como melhorar'}
4. Mantenha a mensagem entre 50-150 palavras
5. Use tratamento respeitoso e afetuoso
6. ${aprovado ? 'Incentive a continuar estudando' : 'Encoraje a tentar novamente sem desencorajar'}

FORMATO DA RESPOSTA (OBRIGATÓRIO):
Retorne APENAS um JSON válido no seguinte formato:
{
  "mensagem": "sua mensagem personalizada aqui",
  "tom": "${aprovado ? 'parabenizacao' : 'orientacao'}"
}

IMPORTANTE: Sua resposta deve ser APENAS o JSON, sem texto adicional antes ou depois.`;

  return prompt;
}

function parseMensagemPersonalizada(texto: string): MensagemPersonalizada {
  try {
    // Remove possível texto antes/depois do JSON
    const jsonMatch = texto.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON não encontrado na resposta');
    }

    const json = JSON.parse(jsonMatch[0]);

    return {
      mensagem: String(json.mensagem || 'Mensagem não disponível'),
      tom: json.tom === 'parabenizacao' || json.tom === 'orientacao' ? json.tom : 'orientacao'
    };
  } catch (error) {
    logger.error('Erro ao parsear mensagem personalizada', { texto, error });

    // Fallback
    return {
      mensagem: 'Continue se dedicando aos estudos. Você está no caminho certo!',
      tom: 'orientacao'
    };
  }
}
