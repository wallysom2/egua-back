import { z } from 'zod';

export const exercicioSchema = z.object({
  titulo: z
    .string()
    .min(3, {
      message: 'Título do exercício deve ter pelo menos 3 caracteres',
    }),
  descricao: z.string().optional(),
  linguagem_id: z.number({
    required_error: 'Linguagem do exercício é obrigatória',
  }),
  tipo: z.enum(['quiz', 'pratico', 'texto_livre']).optional().default('quiz'),
  dificuldade: z.enum(['facil', 'medio', 'dificil']).optional().default('medio'),
  questoes: z
    .array(
      z.object({
        questao_id: z.number(),
        ordem: z.number().optional().default(0),
      }),
    )
    .optional()
    .default([]),
});

export type ExercicioInput = z.infer<typeof exercicioSchema>;
