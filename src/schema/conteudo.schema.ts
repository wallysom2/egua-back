import { z } from 'zod';

export const conteudoSchema = z.object({
  linguagem_id: z.number({ required_error: 'Linguagem é obrigatória' }),
  titulo: z.string().min(3, { message: 'Título deve ter pelo menos 3 caracteres' }),
  corpo: z.string().min(10, { message: 'O corpo do conteúdo deve ser mais detalhado' }),
  nivel_leitura: z.enum(['basico', 'intermediario'], { message: 'Nível de leitura inválido' }),
});

export type ConteudoInput = z.infer<typeof conteudoSchema>; 