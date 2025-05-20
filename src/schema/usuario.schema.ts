import { z } from 'zod';

export type TipoUsuario = 'professor' | 'aluno' | 'desenvolvedor';

export const cadastroSchema = z.object({
  nome: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  senha: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
  confirmarSenha: z.string(),
  tipo: z.enum(['professor', 'aluno', 'desenvolvedor'], {
    errorMap: () => ({ message: 'Tipo de usuário inválido' })
  })
}).refine(data => data.senha === data.confirmarSenha, {
  message: 'Senhas não conferem',
  path: ['confirmarSenha']
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  senha: z.string().min(1, { message: 'Senha é obrigatória' })
});

export type CadastroInput = z.infer<typeof cadastroSchema>;
export type LoginInput = z.infer<typeof loginSchema>; 