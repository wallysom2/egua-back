import { z } from 'zod';

export const submeterRespostaSchema = z.object({
  user_exercicio_id: z.string().uuid({ message: 'ID do progresso do exercício inválido' }),
  questao_id: z.number({ required_error: 'ID da questão é obrigatório' }),
  resposta: z.string().min(1, { message: 'A resposta não pode estar vazia' })
  // usuario_id será pego do token JWT autenticado e validado contra o user_exercicio_id
});

export type SubmeterRespostaInput = z.infer<typeof submeterRespostaSchema>; 