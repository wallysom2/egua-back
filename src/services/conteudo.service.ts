import { prisma } from '../utils/database.js';
import { ConteudoInput } from '../schema/conteudo.schema.js';

export async function listarConteudos() {
  return await prisma.conteudo.findMany();
}

export async function buscarConteudoPorId(id: number) {
  return await prisma.conteudo.findUnique({ where: { id } });
}

export async function criarConteudo(data: ConteudoInput) {
  return await prisma.conteudo.create({ data });
}

export async function atualizarConteudo(id: number, data: ConteudoInput) {
  return await prisma.conteudo.update({ where: { id }, data });
}

export async function deletarConteudo(id: number) {
  return await prisma.conteudo.delete({ where: { id } });
} 