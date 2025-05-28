import { prisma } from '../utils/database.js';
import { QuestaoInput } from '../schema/questao.schema.js';

export async function listarQuestoes(conteudoId?: number) {
  return await prisma.questao.findMany({
    where: conteudoId ? { conteudo_id: conteudoId } : {},
  });
}

export async function buscarQuestaoPorId(id: number) {
  return await prisma.questao.findUnique({ where: { id } });
}

export async function criarQuestao(data: QuestaoInput) {
  return await prisma.questao.create({ data });
}

export async function atualizarQuestao(id: number, data: QuestaoInput) {
  return await prisma.questao.update({
    where: { id },
    data,
  });
}

export async function deletarQuestao(id: number) {
  return await prisma.questao.delete({ where: { id } });
} 