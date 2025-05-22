import { z } from 'zod';

const opcoesSchema = z.array(z.object({
  id: z.string(),
  texto: z.string()
}));

export const questaoSchema = z.object({
  conteudo_id: z.number().optional(),
  enunciado: z.string().min(10, { message: 'Enunciado da questão deve ser mais detalhado' }),
  nivel: z.enum(['facil', 'medio', 'dificil'], { message: 'Nível da questão inválido' }),
  tipo: z.enum(['quiz', 'programacao'], { message: 'Tipo de questão inválido' }),
  opcoes: z.array(z.object({
    id: z.string(),
    texto: z.string()
  })).optional().refine((opcoes) => {
    if (!opcoes) return true;
    return opcoes.length >= 2 && opcoes.length <= 5;
  }, { message: 'A questão deve ter entre 2 e 5 opções' }),
  resposta_correta: z.string().optional(),
  exemplo_resposta: z.string().optional()
}).refine((data) => {
  if (data.tipo === 'quiz') {
    return data.opcoes && data.resposta_correta && data.opcoes.some(op => op.id === data.resposta_correta);
  }
  if (data.tipo === 'programacao') {
    return !!data.exemplo_resposta;
  }
  return true;
}, { message: 'Dados inválidos para o tipo de questão especificado' });

export type QuestaoInput = z.infer<typeof questaoSchema>; 