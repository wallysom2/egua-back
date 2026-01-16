import { z } from 'zod';

// =============================================
// SCHEMAS DE TURMA
// =============================================

export const criarTurmaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255),
  descricao: z.string().optional(),
});

export const atualizarTurmaSchema = z.object({
  nome: z.string().min(3).max(255).optional(),
  descricao: z.string().optional(),
  ativo: z.boolean().optional(),
});

export const entrarTurmaSchema = z.object({
  codigo_acesso: z
    .string()
    .transform((val) => val.trim().toUpperCase())
    .pipe(z.string().length(8, 'Código deve ter 8 caracteres')),
});

// =============================================
// SCHEMAS DE EXERCÍCIOS DA TURMA
// =============================================

export const adicionarExercicioTurmaSchema = z.object({
  exercicio_id: z.number().int().positive(),
  ordem: z.number().int().min(0).optional().default(0),
  obrigatorio: z.boolean().optional().default(true),
});

// =============================================
// SCHEMAS DE TRILHA DE APRENDIZADO
// =============================================

export const criarModuloSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(255),
  descricao: z.string().optional(),
  icone: z.string().max(50).optional(),
  ordem: z.number().int().min(0).optional().default(0),
  xp_recompensa: z.number().int().min(0).optional().default(10),
});

export const atualizarModuloSchema = z.object({
  titulo: z.string().min(1).max(255).optional(),
  descricao: z.string().optional(),
  icone: z.string().max(50).optional(),
  ordem: z.number().int().min(0).optional(),
  xp_recompensa: z.number().int().min(0).optional(),
  ativo: z.boolean().optional(),
});

export const criarLicaoSchema = z.object({
  exercicio_id: z.number().int().positive(),
  ordem: z.number().int().min(0).optional().default(0),
  xp_recompensa: z.number().int().min(0).optional().default(5),
});

export const registrarProgressoSchema = z.object({
  completado: z.boolean().optional().default(false),
  pontuacao: z.number().int().min(0).max(100).optional().default(0),
});

// =============================================
// TYPES EXPORTADOS
// =============================================

export type CriarTurmaInput = z.infer<typeof criarTurmaSchema>;
export type AtualizarTurmaInput = z.infer<typeof atualizarTurmaSchema>;
export type EntrarTurmaInput = z.infer<typeof entrarTurmaSchema>;
export type AdicionarExercicioTurmaInput = z.infer<typeof adicionarExercicioTurmaSchema>;
export type CriarModuloInput = z.infer<typeof criarModuloSchema>;
export type AtualizarModuloInput = z.infer<typeof atualizarModuloSchema>;
export type CriarLicaoInput = z.infer<typeof criarLicaoSchema>;
export type RegistrarProgressoInput = z.infer<typeof registrarProgressoSchema>;
