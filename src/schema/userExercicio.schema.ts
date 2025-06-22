import { z } from 'zod';

export const finalizarExercicioSchema = z
  .object({})
  .optional()
  .or(z.object({}));
// Aceita objeto vazio ou opcional, já que não precisa enviar nada no body

export type FinalizarExercicioInput = z.infer<typeof finalizarExercicioSchema>;
