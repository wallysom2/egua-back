import { Request, Response } from 'express';
import { ConteudoInput } from '../schema/conteudo.schema.js';
import * as conteudoService from '../services/conteudo.service.js';

export async function listarConteudos(req: Request, res: Response) {
  const conteudos = await conteudoService.listarConteudos();
  res.json(conteudos);
}

export async function buscarConteudoPorId(req: Request, res: Response) {
  const { id } = req.params;
  const conteudo = await conteudoService.buscarConteudoPorId(Number(id));
  if (!conteudo) return res.status(404).json({ message: 'Conteúdo não encontrado' });
  res.json(conteudo);
}

export async function criarConteudo(req: Request, res: Response) {
  const data = req.body as ConteudoInput;
  const conteudo = await conteudoService.criarConteudo(data);
  res.status(201).json(conteudo);
}

export async function atualizarConteudo(req: Request, res: Response) {
  const { id } = req.params;
  const data = req.body as ConteudoInput;
  const conteudo = await conteudoService.atualizarConteudo(Number(id), data);
  res.json(conteudo);
}

export async function deletarConteudo(req: Request, res: Response) {
  const { id } = req.params;
  await conteudoService.deletarConteudo(Number(id));
  res.status(204).send();
} 