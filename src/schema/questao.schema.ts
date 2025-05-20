import { z } from 'zod';

export const questaoSchema = z.object({
  conteudo_id: z.number({ required_error: 'Conteúdo de referência é obrigatório' }),
  enunciado: z.string().min(10, { message: 'Enunciado da questão deve ser mais detalhado' }),
  nivel: z.enum(['facil', 'medio', 'dificil'], { message: 'Nível da questão inválido' })
});

export type QuestaoInput = z.infer<typeof questaoSchema>; 