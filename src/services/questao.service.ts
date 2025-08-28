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
  const { conteudo_id, ...questaoData } = data;
  
  // Se conteudo_id for fornecido, criar a questão com a relação
  if (conteudo_id) {
    return await prisma.questao.create({
      data: {
        ...questaoData,
        conteudo: {
          connect: { id: conteudo_id }
        }
      }
    });
  }
  
  // Se não, criar a questão sem relação com conteúdo
  return await prisma.questao.create({
    data: questaoData
  });
}

export async function atualizarQuestao(id: number, data: QuestaoInput) {
  const { conteudo_id, ...questaoData } = data;
  
  // Se conteudo_id for fornecido, atualizar a questão com a relação
  if (conteudo_id) {
    return await prisma.questao.update({
      where: { id },
      data: {
        ...questaoData,
        conteudo: {
          connect: { id: conteudo_id }
        }
      }
    });
  }
  
  // Se não, atualizar a questão sem alterar a relação com conteúdo
  return await prisma.questao.update({
    where: { id },
    data: questaoData
  });
}

export async function deletarQuestao(id: number) {
  return await prisma.questao.delete({ where: { id } });
} 