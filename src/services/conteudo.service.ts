import { prisma } from '../utils/database.js';
import { ConteudoInput } from '../schema/conteudo.schema.js';
import { PrismaClient } from '@prisma/client';

export async function listarConteudos() {
  return await prisma.conteudo.findMany();
}

export async function buscarConteudoPorId(id: number) {
  return await prisma.conteudo.findUnique({
    where: { id: id }
  });
}

export async function criarConteudo(data: ConteudoInput) {
  return await prisma.conteudo.create({ data });
}

export async function atualizarConteudo(id: number, data: ConteudoInput) {
  return await prisma.conteudo.update({ where: { id }, data });
}

export async function deletarConteudo(id: number) {
  return await prisma.$transaction(async (tx: PrismaClient) => {
    // Primeiro desassocia todas as questões do conteúdo
    await tx.questao.updateMany({
      where: { conteudo_id: id },
      data: { conteudo_id: undefined }
    });
    
    // Por fim, deleta o conteúdo
    return await tx.conteudo.delete({
      where: { id }
    });
  });
} 