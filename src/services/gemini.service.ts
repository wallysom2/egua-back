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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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
Você é um professor de programação especializado em avaliar códigos de estudantes na LINGUAGEM ÉGUA.

CONTEXTO IMPORTANTE:
- A linguagem Égua é uma linguagem de programação brasileira
- Sintaxe principal: escreva("mensagem") para imprimir texto
- Comentários: // para linha única
- Variáveis: var nome = valor
- A linguagem usa palavras em português, não em inglês

ENUNCIADO DO EXERCÍCIO:
${enunciado}

RESPOSTA DO ESTUDANTE:
${resposta}

${exemploResposta ? `EXEMPLO DE RESPOSTA ESPERADA:\n${exemploResposta}\n` : ''}

INSTRUÇÕES PARA ANÁLISE:
1. Analise EXCLUSIVAMENTE baseado na sintaxe da linguagem Égua
2. Para "Olá mundo", a sintaxe correta é: escreva("Olá, mundo!")
3. NÃO aceite sintaxes de outras linguagens como print(), console.log(), etc.
4. Verifique se usa as palavras-chave corretas da linguagem Égua
5. Considere boas práticas específicas da linguagem Égua
6. Dê uma pontuação de 0 a 100

FORMATO DA RESPOSTA (OBRIGATÓRIO):
Retorne APENAS um JSON válido no seguinte formato:
{
  "aprovado": boolean,
  "feedback": "string com feedback detalhado sobre linguagem Égua",
  "pontuacao": number (0-100),
  "sugestoes": ["array", "de", "sugestões", "específicas", "para", "linguagem", "égua"]
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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
        ? "Parabéns! Você acertou o exercício na linguagem Égua. Continue assim, você está indo muito bem!" 
        : "Não desanime! Lembre-se que na linguagem Égua usamos escreva() para mostrar mensagens. Tente novamente!",
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
Você é um professor especializado em ensinar a linguagem de programação ÉGUA para idosos de forma carinhosa e paciente.

CONTEXTO IMPORTANTE:
- O aluno é uma pessoa idosa aprendendo a linguagem Égua (linguagem brasileira)
- A linguagem Égua usa escreva() para imprimir texto, não print() ou outras funções
- ${aprovado ? 'A resposta está CORRETA' : 'A resposta está INCORRETA'}
- Exercício: ${enunciado}
- Resposta do aluno: ${resposta}
- Análise técnica: ${feedback}

INSTRUÇÕES:
1. Use linguagem simples
2. Evite termos técnicos complexos
3. ${aprovado ? 'PARABENIZE o aluno pelo acerto de forma objetiva' : 'DÊ ORIENTAÇÃO sucinta sobre como corrigir usando a sintaxe da linguagem Égua'}
4. Se a resposta estiver incorreta, mencione especificamente o que deve ser feito para corrigir usando a sintaxe da linguagem Égua
5. Mantenha a mensagem entre 50-150 palavras
6. Use tratamento respeitoso e direto
7. ${aprovado ? 'Incentive a continuar estudando' : 'Encoraje a tentar novamente com a sintaxe correta da Égua'}
9. Evite usar termos no diminutivo como certinha, direitinho, etc.

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
