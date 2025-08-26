import { prisma } from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

export interface FinalizarExercicioParams {
  usuarioId: string;
  exercicioId: number;
}

export interface ExercicioFinalizado {
  id: string;
  usuario_id: string;
  exercicio_id: number;
  iniciado_em: Date;
  finalizado_em: Date;
  status: 'concluido';
  exercicio: {
    id: number;
    titulo: string;
    linguagem: {
      id: number;
      nome: string;
    };
  };
  usuario: {
    id: string;
    nome: string;
    email: string;
    tipo: string;
  };
  user_resposta: any[];
}

export interface EstatisticasExercicio {
  total_questoes: number;
  respostas_analisadas: number;
  respostas_aprovadas: number;
  percentual_conclusao: number;
  percentual_aprovacao: number;
}

export interface ResultadoFinalizacao {
  progresso: ExercicioFinalizado;
  estatisticas: EstatisticasExercicio;
  tempo_total: number;
}

export async function verificarUsuarioExiste(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
  });

  if (!usuario) {
    throw new Error('Usuário não encontrado');
  }

  return usuario;
}

export async function verificarExercicioExiste(exercicioId: number) {
  const exercicio = await prisma.exercicio.findUnique({
    where: { id: exercicioId },
  });

  if (!exercicio) {
    throw new Error('Exercício não encontrado');
  }

  return exercicio;
}

export async function buscarProgressoExistente(
  usuarioId: string,
  exercicioId: number,
) {
  return await prisma.user_exercicio.findFirst({
    where: {
      usuario_id: usuarioId,
      exercicio_id: exercicioId,
    },
    include: {
      exercicio: { include: { linguagem: true } },
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
        },
      },
      user_resposta: {
        include: {
          questao: true,
          ia_evaluacao: { include: { ia_criterio: true } },
        },
      },
    },
  });
}

export async function criarNovoProgresso(
  usuarioId: string,
  exercicioId: number,
): Promise<ExercicioFinalizado> {
  return await prisma.user_exercicio.create({
    data: {
      id: uuidv4(),
      usuario_id: usuarioId,
      exercicio_id: exercicioId,
      iniciado_em: new Date(),
      finalizado_em: new Date(), // Finalizar imediatamente
      status: 'concluido',
    },
    include: {
      exercicio: { include: { linguagem: true } },
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
        },
      },
      user_resposta: {
        include: {
          questao: true,
          ia_evaluacao: { include: { ia_criterio: true } },
        },
      },
    },
  });
}

export async function atualizarProgressoExistente(
  progressoId: string,
): Promise<ExercicioFinalizado> {
  return await prisma.user_exercicio.update({
    where: { id: progressoId },
    data: {
      finalizado_em: new Date(),
      status: 'concluido',
    },
    include: {
      exercicio: { include: { linguagem: true } },
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
        },
      },
      user_resposta: {
        include: {
          questao: true,
          ia_evaluacao: { include: { ia_criterio: true } },
        },
      },
    },
  });
}

export function calcularEstatisticas(
  userRespostas: any[],
): EstatisticasExercicio {
  const totalQuestoes = userRespostas.length;
  const respostasAnalisadas = userRespostas.filter(
    (resposta) => resposta.ia_evaluacao.length > 0,
  ).length;
  const respostasAprovadas = userRespostas.filter((resposta) =>
    resposta.ia_evaluacao.some((avaliacao: any) => avaliacao.aprovado),
  ).length;

  return {
    total_questoes: totalQuestoes,
    respostas_analisadas: respostasAnalisadas,
    respostas_aprovadas: respostasAprovadas,
    percentual_conclusao:
      totalQuestoes > 0
        ? Math.round((respostasAnalisadas / totalQuestoes) * 100)
        : 0,
    percentual_aprovacao:
      respostasAnalisadas > 0
        ? Math.round((respostasAprovadas / respostasAnalisadas) * 100)
        : 0,
  };
}

export function calcularTempoTotal(
  iniciadoEm: Date,
  finalizadoEm: Date,
): number {
  return finalizadoEm
    ? Math.round((finalizadoEm.getTime() - iniciadoEm.getTime()) / 1000 / 60) // em minutos
    : 0;
}

export async function finalizarExercicio(
  params: FinalizarExercicioParams,
): Promise<ResultadoFinalizacao> {
  const { usuarioId, exercicioId } = params;

  // Verificar se usuário e exercício existem
  await verificarUsuarioExiste(usuarioId);
  await verificarExercicioExiste(exercicioId);

  // Buscar progresso existente
  let progresso = await buscarProgressoExistente(usuarioId, exercicioId);

  if (!progresso) {
    // Criar novo progresso se não existir
    progresso = await criarNovoProgresso(usuarioId, exercicioId);
  } else {
    // Verificar se já foi concluído
    if (progresso.status === 'concluido') {
      throw new Error('Exercício já foi concluído');
    }

    // Atualizar progresso existente
    progresso = await atualizarProgressoExistente(progresso.id);
  }

  // Calcular estatísticas
  const estatisticas = calcularEstatisticas(progresso.user_resposta);

  // Calcular tempo total
  const tempoTotal = calcularTempoTotal(
    progresso.iniciado_em,
    progresso.finalizado_em,
  );

  return {
    progresso,
    estatisticas,
    tempo_total: tempoTotal,
  };
}

export async function iniciarExercicio(
  usuarioId: string,
  exercicioId: number,
): Promise<ExercicioFinalizado> {
  // Verificar se usuário e exercício existem
  await verificarUsuarioExiste(usuarioId);
  await verificarExercicioExiste(exercicioId);

  // Verificar se já existe um progresso
  const progressoExistente = await buscarProgressoExistente(usuarioId, exercicioId);

  if (progressoExistente) {
    // Se já existe, retornar o existente
    return progressoExistente;
  }

  // Criar novo progresso em andamento
  return await prisma.user_exercicio.create({
    data: {
      id: uuidv4(),
      usuario_id: usuarioId,
      exercicio_id: exercicioId,
      iniciado_em: new Date(),
      status: 'em_andamento',
    },
    include: {
      exercicio: { include: { linguagem: true } },
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
        },
      },
      user_resposta: {
        include: {
          questao: true,
          ia_evaluacao: { include: { ia_criterio: true } },
        },
      },
    },
  });
}

export async function listarProgressoUsuario(usuarioId: string) {
  return await prisma.user_exercicio.findMany({
    where: { usuario_id: usuarioId },
    include: {
      exercicio: { include: { linguagem: true } },
      user_resposta: { include: { questao: true } },
    },
    orderBy: {
      iniciado_em: 'desc',
    },
  });
}

export async function obterStatusExercicio(
  usuarioId: string,
  exercicioId: number,
) {
  const progresso = await prisma.user_exercicio.findFirst({
    where: {
      usuario_id: usuarioId,
      exercicio_id: exercicioId,
    },
    include: {
      exercicio: { include: { linguagem: true } },
      user_resposta: {
        include: {
          questao: true,
          ia_evaluacao: { include: { ia_criterio: true } },
        },
      },
    },
  });

  if (!progresso) {
    return {
      status: 'nao_iniciado',
      exercicio_id: exercicioId,
      progresso: null,
    };
  }

  const estatisticas = calcularEstatisticas(progresso.user_resposta);

  return {
    status: progresso.status,
    exercicio_id: exercicioId,
    progresso: {
      ...progresso,
      estatisticas,
    },
  };
}

export async function listarExerciciosConcluidos(usuarioId: string) {
  const exerciciosConcluidos = await prisma.user_exercicio.findMany({
    where: {
      usuario_id: usuarioId,
      status: 'concluido',
    },
    include: {
      exercicio: { include: { linguagem: true } },
      user_resposta: {
        include: {
          questao: true,
          ia_evaluacao: { include: { ia_criterio: true } },
        },
      },
    },
    orderBy: {
      finalizado_em: 'desc',
    },
  });

  return exerciciosConcluidos.map((exercicio: any) => {
    const totalQuestoes = exercicio.user_resposta.length;
    const respostasAprovadas = exercicio.user_resposta.filter((resposta: any) =>
      resposta.ia_evaluacao.some((avaliacao: any) => avaliacao.aprovado),
    ).length;

    return {
      ...exercicio,
      estatisticas: {
        total_questoes: totalQuestoes,
        respostas_aprovadas: respostasAprovadas,
        percentual_aprovacao:
          totalQuestoes > 0
            ? Math.round((respostasAprovadas / totalQuestoes) * 100)
            : 0,
      },
    };
  });
}

export async function obterResumoProgresso(usuarioId: string) {
  const todosProgressos = await prisma.user_exercicio.findMany({
    where: { usuario_id: usuarioId },
    include: {
      exercicio: { include: { linguagem: true } },
      user_resposta: {
        include: {
          ia_evaluacao: true,
        },
      },
    },
  });

  const totalExercicios = todosProgressos.length;
  const exerciciosConcluidos = todosProgressos.filter(
    (p: any) => p.status === 'concluido',
  ).length;
  const exerciciosEmAndamento = todosProgressos.filter(
    (p: any) => p.status === 'em_andamento',
  ).length;

  const totalRespostas = todosProgressos.reduce(
    (acc: number, progresso: any) => acc + progresso.user_resposta.length,
    0,
  );
  const totalRespostasAprovadas = todosProgressos.reduce((acc: number, progresso: any) => {
    return (
      acc +
      progresso.user_resposta.filter((resposta: any) =>
        resposta.ia_evaluacao.some((avaliacao: any) => avaliacao.aprovado),
      ).length
    );
  }, 0);

  return {
    total_exercicios: totalExercicios,
    exercicios_concluidos: exerciciosConcluidos,
    exercicios_em_andamento: exerciciosEmAndamento,
    percentual_conclusao:
      totalExercicios > 0
        ? Math.round((exerciciosConcluidos / totalExercicios) * 100)
        : 0,
    total_respostas: totalRespostas,
    total_respostas_aprovadas: totalRespostasAprovadas,
    percentual_aprovacao:
      totalRespostas > 0
        ? Math.round((totalRespostasAprovadas / totalRespostas) * 100)
        : 0,
  };
}
