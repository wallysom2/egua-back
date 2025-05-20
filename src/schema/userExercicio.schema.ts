import { z } from 'zod';

export const iniciarExercicioSchema = z.object({
  exercicio_id: z.number({ required_error: 'ID do exercício é obrigatório' }),
  // usuario_id será pego do token JWT autenticado
});

export const finalizarExercicioSchema = z.object({
  // usuario_id e exercicio_id (ou user_exercicio_id) serão identificados pela rota/token
  status: z.enum(['concluido'], { message: 'Status de finalização inválido' }) 
});

export type IniciarExercicioInput = z.infer<typeof iniciarExercicioSchema>;
export type FinalizarExercicioInput = z.infer<typeof finalizarExercicioSchema>; 