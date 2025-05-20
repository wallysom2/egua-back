import { z } from 'zod';

export const linguagemSchema = z.object({
  nome: z.string().min(2, { message: 'Nome da linguagem deve ter pelo menos 2 caracteres' })
});

export type LinguagemInput = z.infer<typeof linguagemSchema>; 