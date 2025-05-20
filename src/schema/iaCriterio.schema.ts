import { z } from 'zod';

export const iaCriterioSchema = z.object({
  nome: z.string().min(3, { message: 'Nome do critério deve ter pelo menos 3 caracteres' }),
  peso: z.number().min(0.1, { message: 'Peso deve ser no mínimo 0.1' }).max(1.0, { message: 'Peso deve ser no máximo 1.0' }).optional().default(1.0)
});

export type IaCriterioInput = z.infer<typeof iaCriterioSchema>; 