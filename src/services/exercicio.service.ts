import { prisma } from '../utils/database.js';
import { ExercicioInput } from '../schema/exercicio.schema.js';
import { Prisma } from '@prisma/client';

export async function listarExercicios(linguagemId?: string) {
  return await prisma.exercicio.findMany({
    where: linguagemId ? { linguagem_id: Number(linguagemId) } : {},
    include: {
      linguagem: true,
      exercicio_questao: {
        include: { questao: true },
        orderBy: { ordem: 'asc' },
      },
    },
  });
}

export async function buscarExercicioPorId(id: string) {
  return await prisma.exercicio.findUnique({
    where: { id: Number(id) },
    include: {
      exercicio_questao: {
        include: { questao: true },
        orderBy: { ordem: 'asc' },
      },
    },
  });
}

export async function criarExercicio(dados: ExercicioInput) {
  const { questoes, ...dadosExercicio } = dados;

  const dadosValidos = {
    titulo: dadosExercicio.titulo,
    linguagem_id: dadosExercicio.linguagem_id,
  };

  return await prisma.exercicio.create({
    data: {
      ...dadosValidos,
      exercicio_questao: {
        create: questoes.map((q) => ({
          questao_id: q.questao_id,
          ordem: q.ordem,
        })),
      },
    },
    include: {
      exercicio_questao: {
        include: { questao: true },
        orderBy: { ordem: 'asc' },
      },
    },
  });
}

export async function atualizarExercicio(id: string, dados: ExercicioInput) {
  const { questoes, ...dadosExercicio } = dados;

  const dadosValidos = {
    titulo: dadosExercicio.titulo,
    linguagem_id: dadosExercicio.linguagem_id,
  };

  await prisma.exercicio_questao.deleteMany({
    where: { exercicio_id: Number(id) },
  });

  return await prisma.exercicio.update({
    where: { id: Number(id) },
    data: {
      ...dadosValidos,
      exercicio_questao: {
        create: questoes.map((q) => ({
          questao_id: q.questao_id,
          ordem: q.ordem,
        })),
      },
    },
    include: {
      exercicio_questao: {
        include: { questao: true },
        orderBy: { ordem: 'asc' },
      },
    },
  });
}

export async function deletarExercicio(id: string) {
  // Deletar em cascata os registros relacionados que não têm onDelete: Cascade
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Primeiro, deletar todas as respostas dos usuários relacionadas a este exercício
    await tx.user_resposta.deleteMany({
      where: {
        user_exercicio: {
          exercicio_id: Number(id)
        }
      }
    });

    // Depois, deletar todos os user_exercicio relacionados
    await tx.user_exercicio.deleteMany({
      where: { exercicio_id: Number(id) }
    });

    // Por fim, deletar o exercício (exercicio_questao será deletado automaticamente por cascade)
    await tx.exercicio.delete({
      where: { id: Number(id) }
    });
  });

  return { message: 'Exercício deletado com sucesso' };
}
