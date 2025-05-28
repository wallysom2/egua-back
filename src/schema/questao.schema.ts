import { z } from 'zod';

export const questaoSchema = z.object({
  conteudo_id: z.number({ 
    required_error: 'Conteúdo de referência é obrigatório' 
  }).int({ 
    message: 'ID do conteúdo deve ser um número inteiro' 
  }).positive({ 
    message: 'ID do conteúdo deve ser um número positivo' 
  }),
  enunciado: z.string({ 
    required_error: 'Enunciado é obrigatório' 
  }).min(10, { 
    message: 'Enunciado da questão deve ter pelo menos 10 caracteres' 
  }).max(10000, { 
    message: 'Enunciado da questão é muito longo (máximo 10.000 caracteres)' 
  }),
  nivel: z.enum(['facil', 'medio', 'dificil'], { 
    required_error: 'Nível da questão é obrigatório',
    invalid_type_error: 'Nível da questão deve ser: facil, medio ou dificil' 
  })
});

export type QuestaoInput = z.infer<typeof questaoSchema>; 