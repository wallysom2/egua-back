import { z } from 'zod';

export const exercicioSchema = z.object({
  titulo: z
    .string()
    .min(3, {
      message: 'Título do exercício deve ter pelo menos 3 caracteres',
    }),
  linguagem_id: z.number({
    required_error: 'Linguagem do exercício é obrigatória',
  }),
  questoes: z
    .array(
      z.object({
        questao_id: z.number(),
        ordem: z.number().optional().default(0),
      }),
    )
    .min(1, { message: 'Exercício deve ter pelo menos uma questão' }),
});

export type ExercicioInput = z.infer<typeof exercicioSchema>;
