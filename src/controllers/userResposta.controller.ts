import { Request, Response } from 'express';
import { prisma } from '../utils/database.js';
import { SubmeterRespostaInput } from '../schema/userResposta.schema.js';
import { v4 as uuidv4 } from 'uuid';
import * as geminiService from '../services/gemini.service.js';
import { logger } from '../utils/logger.js';

// Extender a interface Request para incluir o usuário autenticado
interface AuthenticatedRequest extends Request {
  usuario?: { usuarioId: string; tipo: string };
}

export async function submeterResposta(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { user_exercicio_id, questao_id, resposta } =
    req.body as SubmeterRespostaInput;
  const usuarioId = req.usuario?.usuarioId;

  if (!usuarioId) {
    return res.status(403).json({ message: 'Usuário não autenticado' });
  }

  try {
    // Verificar se o user_exercicio_id pertence ao usuário logado e se está em andamento
    const progressoExercicio = await prisma.user_exercicio.findFirst({
      where: {
        id: user_exercicio_id,
        usuario_id: usuarioId,
        // status: 'em_andamento' // Opcional: permitir submeter apenas se em andamento
      },
    });

    if (!progressoExercicio) {
      return res.status(404).json({
        message:
          'Progresso do exercício não encontrado ou não pertence ao usuário',
      });
    }

    // Verificar se a questão pertence ao exercício
    const questaoNoExercicio = await prisma.exercicio_questao.findFirst({
      where: {
        exercicio_id: progressoExercicio.exercicio_id,
        questao_id: questao_id,
      },
    });

    if (!questaoNoExercicio) {
      return res
        .status(400)
        .json({ message: 'Questão não faz parte do exercício informado' });
    }

    // Verificar se já existe uma resposta para essa questão nesse progresso
    // Se sim, poderia ser um update ou impedir nova submissão.
    // Por ora, vamos permitir criar uma nova, o que pode ser útil para histórico, mas pode precisar de ajuste.
    const novaResposta = await prisma.user_resposta.create({
      data: {
        id: uuidv4(),
        user_exercicio_id,
        questao_id,
        resposta,
        // ia_evaluacao será preenchida depois
      },
    });

    // Verificar se é uma questão de programação para análise automática
    const questao = await prisma.questao.findUnique({
      where: { id: questao_id },
      select: { tipo: true, enunciado: true, exemplo_resposta: true },
    });

    if (questao?.tipo === 'programacao') {
      // Processar análise com Gemini de forma assíncrona
      processarAnaliseProgramacao(
        novaResposta.id,
        questao.enunciado,
        resposta,
        questao.exemplo_resposta,
      ).catch((error) => {
        logger.error('Erro na análise assíncrona', {
          respostaId: novaResposta.id,
          error,
        });
      });
    }

    res.status(201).json(novaResposta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao submeter resposta', error });
  }
}

export async function obterAnaliseResposta(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { respostaId } = req.params;
  const usuarioId = req.usuario?.usuarioId;

  if (!usuarioId) {
    return res.status(403).json({ message: 'Usuário não autenticado' });
  }

  try {
    // Verificar se a resposta pertence ao usuário
    const resposta = await prisma.user_resposta.findFirst({
      where: {
        id: respostaId,
        user_exercicio: { usuario_id: usuarioId },
      },
      include: {
        questao: { select: { enunciado: true, tipo: true } },
        ia_evaluacao: {
          include: { ia_criterio: true },
          orderBy: { avaliado_em: 'desc' },
        },
      },
    });

    if (!resposta) {
      return res.status(404).json({
        message: 'Resposta não encontrada ou não pertence ao usuário',
      });
    }

    // Se não há análise ainda (questão não é de programação ou ainda processando)
    if (resposta.ia_evaluacao.length === 0) {
      // Para questões não de programação, ainda podemos gerar uma mensagem personalizada genérica
      let mensagemPersonalizada;
      if (resposta.questao.tipo !== 'programacao') {
        try {
          mensagemPersonalizada = await geminiService.gerarMensagemPersonalizadaIdoso(
            true, // Assumimos positivo para questões não avaliadas automaticamente
            'Resposta submetida com sucesso',
            resposta.questao.enunciado,
            resposta.resposta,
          );
        } catch (error) {
          mensagemPersonalizada = {
            mensagem: "Obrigado por sua resposta na linguagem Égua! Continue praticando e aprendendo.",
            tom: 'parabenizacao' as const
          };
        }
      }

      return res.json({
        resposta: resposta.resposta,
        questao: resposta.questao,
        analise_disponivel: false,
        status:
          resposta.questao.tipo === 'programacao'
            ? 'processando'
            : 'nao_aplicavel',
        mensagem_personalizada: mensagemPersonalizada || {
          mensagem: "Sua resposta na linguagem Égua está sendo processada. Aguarde um momento!",
          tom: 'orientacao' as const
        },
      });
    }

    // Verificar se é aprovado baseado nas avaliações
    const aprovado = resposta.ia_evaluacao.every(
      (avaliacao: any) => avaliacao.aprovado,
    );

    // Gerar mensagem personalizada para idosos em tempo real
    let mensagemPersonalizada;
    try {
      const feedbackGeral = resposta.ia_evaluacao.length > 0 
        ? resposta.ia_evaluacao[0].feedback_geral 
        : 'Análise não disponível';

      mensagemPersonalizada = await geminiService.gerarMensagemPersonalizadaIdoso(
        aprovado,
        feedbackGeral,
        resposta.questao.enunciado,
        resposta.resposta,
      );
    } catch (error) {
      logger.error('Erro ao gerar mensagem personalizada', error);
      // Fallback para mensagem padrão
      mensagemPersonalizada = {
        mensagem: aprovado 
          ? "Parabéns! Você acertou o exercício na linguagem Égua. Continue assim, você está indo muito bem!" 
          : "Não desanime! Lembre-se que na linguagem Égua usamos escreva() para mostrar mensagens. Tente novamente!",
        tom: aprovado ? 'parabenizacao' : 'orientacao'
      };
    }

    // Retornar análise simplificada
    const analiseCompleta = {
      resposta: resposta.resposta,
      questao: resposta.questao,
      analise_disponivel: true,
      resultado_geral: {
        aprovado,
        pontuacao_media: calcularPontuacaoMedia(resposta.ia_evaluacao),
      },
      mensagem_personalizada: mensagemPersonalizada,
    };

    res.json(analiseCompleta);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Erro ao obter análise da resposta', error });
  }
}

export async function listarRespostasPorProgresso(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { userExercicioId } = req.params;
  const usuarioId = req.usuario?.usuarioId;

  if (!usuarioId) {
    return res.status(403).json({ message: 'Usuário não autenticado' });
  }

  try {
    // Verificar se o user_exercicio_id pertence ao usuário logado
    const progressoExercicio = await prisma.user_exercicio.findFirst({
      where: { id: userExercicioId, usuario_id: usuarioId },
    });

    if (!progressoExercicio) {
      return res.status(404).json({
        message:
          'Progresso do exercício não encontrado ou não pertence ao usuário',
      });
    }

    const respostas = await prisma.user_resposta.findMany({
      where: { user_exercicio_id: userExercicioId },
      include: {
        questao: true,
        ia_evaluacao: { include: { ia_criterio: true } },
      },
      orderBy: { submetido_em: 'asc' },
    });
    res.json(respostas);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar respostas', error });
  }
}

// Função para processar análise de programação de forma assíncrona
async function processarAnaliseProgramacao(
  respostaId: string,
  enunciado: string,
  resposta: string,
  exemploResposta?: string | null,
) {
  try {
    logger.info('Iniciando análise de programação', { respostaId });

    // Chamar o serviço Gemini para análise
    const analise = await geminiService.analisarRespostaProgramacao(
      enunciado,
      resposta,
      exemploResposta || undefined,
    );

    // Buscar ou criar critérios de avaliação
    const criterios = await obterCriteriosAvaliacao();

    // Salvar as avaliações no banco
    for (const criterio of criterios) {
      await prisma.ia_evaluacao.create({
        data: {
          id: uuidv4(),
          user_resposta_id: respostaId,
          criterio_id: criterio.id,
          aprovado: analise.aprovado,
          pontuacao: analise.pontuacao,
          feedback_geral: analise.feedback,
          sugestoes: analise.sugestoes,
          feedback_especifico: `Sugestões: ${analise.sugestoes.join(', ')}`,
          avaliado_em: new Date(),
        },
      });
    }

    logger.info('Análise de programação concluída', {
      respostaId,
      aprovado: analise.aprovado,
      pontuacao: analise.pontuacao,
    });
  } catch (error) {
    logger.error('Erro ao processar análise de programação', {
      respostaId,
      error,
    });

    // Em caso de erro, criar uma avaliação indicando falha
    const criterios = await obterCriteriosAvaliacao();
    if (criterios.length > 0) {
      await prisma.ia_evaluacao.create({
        data: {
          id: uuidv4(),
          user_resposta_id: respostaId,
          criterio_id: criterios[0].id,
          aprovado: false,
          pontuacao: 0,
          feedback_geral:
            'Erro na análise automática. Resposta será revisada manualmente.',
          sugestoes: [],
          feedback_especifico: 'Falha no processamento automático.',
          avaliado_em: new Date(),
        },
      });
    }
  }
}

// Função para obter ou criar critérios de avaliação padrão
async function obterCriteriosAvaliacao() {
  const criteriosExistentes = await prisma.ia_criterio.findMany();

  if (criteriosExistentes.length === 0) {
    // Criar critérios padrão se não existirem
    const criteriosPadrao = [
      { nome: 'Correção do Código', peso: 40 },
      { nome: 'Boas Práticas', peso: 30 },
      { nome: 'Eficiência', peso: 20 },
      { nome: 'Legibilidade', peso: 10 },
    ];

    const criteriosCriados = [];
    for (const criterio of criteriosPadrao) {
      const novoCriterio = await prisma.ia_criterio.create({
        data: {
          nome: criterio.nome,
          peso: criterio.peso,
        },
      });
      criteriosCriados.push(novoCriterio);
    }

    return criteriosCriados;
  }

  return criteriosExistentes;
}

// Função auxiliar para calcular pontuação média ponderada
function calcularPontuacaoMedia(avaliacoes: any[]): number {
  if (avaliacoes.length === 0) return 0;

  let somaTotal = 0;
  let pesoTotal = 0;

  for (const avaliacao of avaliacoes) {
    const peso = avaliacao.ia_criterio.peso;
    const pontos = avaliacao.aprovado ? 100 : 0;

    somaTotal += pontos * peso;
    pesoTotal += peso;
  }

  return pesoTotal > 0 ? Math.round((somaTotal / pesoTotal) * 100) / 100 : 0;
}
