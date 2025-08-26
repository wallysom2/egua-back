import { z } from 'zod';

export const questaoSchema = z.object({
  conteudo_id: z.number({ 
    required_error: 'Conteúdo de referência é obrigatório' 
  }).int({ 
    message: 'ID do conteúdo deve ser um número inteiro' 
  }).positive({ 
    message: 'ID do conteúdo deve ser um número positivo' 
  }).optional().nullable(),
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
  }),
  tipo: z.enum(['quiz', 'programacao'], {
    required_error: 'Tipo da questão é obrigatório',
    invalid_type_error: 'Tipo da questão deve ser: quiz ou programacao'
  }).default('quiz'),
  
  // Campos para questões de quiz
  opcoes: z.array(z.string()).optional().nullable(),
  resposta_correta: z.string().optional().nullable(),
  
  // Campo para questões de programação
  exemplo_resposta: z.string().optional().nullable()
  
}).refine((data) => {
  // Validação condicional para questões de quiz
  if (data.tipo === 'quiz') {
    if (!data.opcoes || !Array.isArray(data.opcoes) || data.opcoes.length < 2) {
      return false;
    }
    if (!data.resposta_correta || data.resposta_correta.trim().length === 0) {
      return false;
    }
    // Verificar se resposta_correta está entre as opcoes
    if (!data.opcoes.includes(data.resposta_correta)) {
      return false;
    }
  }
  
  // Validação condicional para questões de programação
  if (data.tipo === 'programacao') {
    if (!data.exemplo_resposta || data.exemplo_resposta.trim().length === 0) {
      return false;
    }
    // Para programação, opcoes e resposta_correta devem ser null/undefined
    if (data.opcoes !== null && data.opcoes !== undefined) {
      return false;
    }
    if (data.resposta_correta !== null && data.resposta_correta !== undefined) {
      return false;
    }
  }
  
  return true;
}, {
  message: "QUIZ: 'opcoes' (mín. 2) e 'resposta_correta' obrigatórios. A resposta deve estar nas opções. PROGRAMAÇÃO: 'exemplo_resposta' obrigatório, 'opcoes' e 'resposta_correta' devem ser null.",
  path: ["tipo"]
});

export type QuestaoInput = z.infer<typeof questaoSchema>; 