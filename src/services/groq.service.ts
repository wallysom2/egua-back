import Groq from 'groq-sdk';
import { logger } from '../utils/logger.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
        const prompt = construirPromptAnalise(enunciado, resposta, exemploResposta);

        logger.info('Enviando análise para Groq', {
            enunciado: enunciado.substring(0, 100),
        });

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1, // Baixa temperatura para análise mais objetiva
            response_format: { type: 'json_object' }, // Forçar resposta JSON
        });

        const text = completion.choices[0]?.message?.content || '{}';

        // Parse da resposta estruturada
        const analise = parseResposta(text);

        logger.info('Análise concluída', {
            aprovado: analise.aprovado,
            pontuacao: analise.pontuacao,
        });

        return analise;
    } catch (error: any) {
        logger.error('Erro na análise do Groq', error);

        // Verificar erros de API Key
        if (error.message?.includes('authentication') || error.status === 401) {
            logger.error('ERRO DE CONFIGURAÇÃO: API Key do Groq inválida ou ausente. Verifique o arquivo .env.');
        }

        return {
            aprovado: false,
            feedback: 'Erro na análise automática. Resposta será revisada manualmente.',
            pontuacao: 0,
            sugestoes: ['Aguarde a revisão manual', 'Verifique a sintaxe da linguagem Égua']
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
        const prompt = construirPromptMensagemIdoso(aprovado, feedback, enunciado, resposta);

        logger.info('Gerando mensagem personalizada para idoso (Groq)', {
            aprovado,
            enunciado: enunciado.substring(0, 50),
        });

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7, // Um pouco mais criativo para a mensagem
            response_format: { type: 'json_object' },
        });

        const text = completion.choices[0]?.message?.content || '{}';
        const mensagem = parseMensagemPersonalizada(text);

        logger.info('Mensagem personalizada gerada', {
            tom: mensagem.tom,
            tamanho: mensagem.mensagem.length,
        });

        return mensagem;
    } catch (error: any) {
        logger.error('Erro ao gerar mensagem personalizada (Groq)', error);
        return gerarMensagemPadrao(aprovado);
    }
}

function construirPromptAnalise(
    enunciado: string,
    resposta: string,
    exemploResposta?: string,
): string {
    return `
Você é um professor de programação especializado em avaliar códigos de estudantes na LINGUAGEM ÉGUA.

CONTEXTO IMPORTANTE:
- A linguagem Égua é uma linguagem de programação brasileira
- Sintaxe principal: escreva("mensagem") para imprimir texto
- Comentários: // para linha única
- Variáveis: var nome = valor
- A linguagem usa palavras em português, não em inglês
- NÃO aceite: print(), console.log(), System.out.println(), printf(), ou qualquer sintaxe de outra linguagem

ENUNCIADO DO EXERCÍCIO:
${enunciado}

RESPOSTA DO ESTUDANTE:
${resposta}

${exemploResposta ? `EXEMPLO DE RESPOSTA ESPERADA:\n${exemploResposta}\n` : ''}

INSTRUÇÕES PARA ANÁLISE:
1. Analise EXCLUSIVAMENTE baseado na sintaxe da linguagem Égua
2. Identifique TODOS os erros específicos na resposta (ex: uso de print() ao invés de escreva(), sintaxe incorreta de variáveis, etc.)
3. Liste exatamente o que está errado e o que deveria estar correto
4. Verifique se o código resolve o problema proposto no enunciado
5. Verifique se usa as palavras-chave corretas da linguagem Égua
6. Considere boas práticas específicas da linguagem Égua
7. Dê uma pontuação de 0 a 100 (aprovado se >= 70)

IMPORTANTE NO FEEDBACK:
- Se houver erros, liste cada erro de forma clara e objetiva
- Para cada erro, explique o que está errado e mostre o que deveria ser
- Use exemplos concretos do código do estudante
- Seja específico: não use expressões vagas como "há alguns problemas"

FORMATO DA RESPOSTA (OBRIGATÓRIO):
Retorne APENAS um JSON válido no seguinte formato:
{
  "aprovado": boolean,
  "feedback": "string detalhada listando cada erro encontrado e como corrigir, com exemplos específicos do código do estudante",
  "pontuacao": number (0-100),
  "sugestoes": ["array", "de", "sugestões", "específicas", "e", "detalhadas", "para", "linguagem", "égua"]
}
`;
}

function construirPromptMensagemIdoso(
    aprovado: boolean,
    feedback: string,
    enunciado: string,
    resposta: string,
): string {
    return `
Você é um professor especializado em ensinar a linguagem de programação ÉGUA para pessoas idosas.

CONTEXTO IMPORTANTE:
- O aluno é uma pessoa idosa aprendendo a linguagem Égua (linguagem brasileira de programação)
- A linguagem Égua usa escreva() para imprimir texto, não print() ou outras funções
- ${aprovado ? 'A resposta está CORRETA' : 'A resposta está INCORRETA'}
- Exercício solicitado: ${enunciado}
- Resposta do aluno: ${resposta}
- Análise técnica detalhada: ${feedback}

REGRAS OBRIGATÓRIAS PARA A MENSAGEM:
1. Use linguagem SIMPLES, CLARA e OBJETIVA
2. Evite termos técnicos complexos ou jargões
3. Seja DIRETO e RESPETOSO (sem infantilização)
4. NUNCA use diminutivos como "certinha", "direitinho", "bonitinho", etc.
5. Trate a pessoa com respeito e dignidade

${aprovado ? `
SE A RESPOSTA ESTIVER CORRETA:
- Parabenize de forma OBJETIVA e RESPETOSA
- Confirme o que o aluno fez corretamente (mencione especificamente o acerto)
- Incentive a continuar praticando
- Mantenha entre 40-80 palavras
` : `
SE A RESPOSTA ESTIVER INCORRETA (CRÍTICO):
- Seja OBJETIVO e DIRETO sobre o erro
- Mencione EXATAMENTE o que está errado no código do aluno (copie partes do código se necessário)
- Mostre CLARAMENTE o que deveria estar escrito ao invés do erro
- Forneça um exemplo concreto de como corrigir, usando o código do próprio aluno
- Explique de forma SIMPLES usando a sintaxe correta da linguagem Égua
- Encoraje a tentar novamente com a correção sugerida
- Mantenha entre 80-150 palavras

EXEMPLO DE COMO DEVE SER:
"Não está correto. Na sua resposta, você usou 'print(idade)', mas na linguagem Égua usamos 'escreva()'. 
O correto seria: escreva(idade). Tente novamente usando escreva() ao invés de print()."
`}

FORMATO DA RESPOSTA (OBRIGATÓRIO):
Retorne APENAS um JSON válido no seguinte formato:
{
  "mensagem": "sua mensagem personalizada aqui, seguindo TODAS as regras acima",
  "tom": "${aprovado ? 'parabenizacao' : 'orientacao'}"
}
`;
}

function parseResposta(texto: string): AnaliseResultado {
    try {
        const json = JSON.parse(texto);
        return {
            aprovado: Boolean(json.aprovado),
            feedback: String(json.feedback || 'Sem feedback disponível'),
            pontuacao: Number(json.pontuacao || 0),
            sugestoes: Array.isArray(json.sugestoes) ? json.sugestoes : [],
        };
    } catch (error) {
        logger.error('Erro ao parsear resposta do Groq', { texto, error });
        return {
            aprovado: false,
            feedback: 'Erro na análise automática. Resposta será revisada manualmente.',
            pontuacao: 0,
            sugestoes: ['Revisar sintaxe', 'Verificar lógica'],
        };
    }
}

function parseMensagemPersonalizada(texto: string): MensagemPersonalizada {
    try {
        const json = JSON.parse(texto);
        return {
            mensagem: String(json.mensagem || 'Mensagem não disponível'),
            tom: json.tom === 'parabenizacao' || json.tom === 'orientacao' ? json.tom : 'orientacao'
        };
    } catch (error) {
        logger.error('Erro ao parsear mensagem personalizada', { texto, error });
        return {
            mensagem: 'Continue se dedicando aos estudos. Você está no caminho certo!',
            tom: 'orientacao'
        };
    }
}

function gerarMensagemPadrao(aprovado: boolean): MensagemPersonalizada {
    if (aprovado) {
        return {
            mensagem: 'Parabéns! Sua resposta está correta. Continue praticando e se dedicando aos estudos.',
            tom: 'parabenizacao'
        };
    } else {
        return {
            mensagem: 'Sua resposta precisa de ajustes. Revise o código e verifique se está usando a sintaxe correta da linguagem Égua. Tente novamente!',
            tom: 'orientacao'
        };
    }
}
