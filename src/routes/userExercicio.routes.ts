import express, { RequestHandler } from 'express';
import { validateRequest } from '../middlewares/validation.middlerare.js';
import { finalizarExercicioSchema } from '../schema/userExercicio.schema.js';
import {
  finalizarExercicio,
  finalizarExercicioPorQuery,
  listarProgressoUsuario,
  obterStatusExercicio,
  listarExerciciosConcluidos,
  obterResumoProgresso,
  verificarEConcluirExercicio,
} from '../controllers/userExercicio.controller.js';

const router = express.Router();

// Lista o progresso de exercícios do usuário logado
router.get('/meu-progresso', listarProgressoUsuario as RequestHandler);

// Obter resumo geral do progresso do usuário
router.get('/resumo', obterResumoProgresso as RequestHandler);

// Lista exercícios concluídos pelo usuário
router.get('/concluidos', listarExerciciosConcluidos as RequestHandler);

// Obter status de um exercício específico
router.get('/status/:exercicioId', obterStatusExercicio as RequestHandler);

// Finalizar exercício via query parameters (?usuarioId=...&exercicioId=...)
router.patch('/finalizar', finalizarExercicioPorQuery as RequestHandler);

// Finalizar exercício via path parameters (/finalizar/:usuarioId/:exercicioId)
router.patch(
  '/finalizar/:usuarioId/:exercicioId',
  finalizarExercicio as RequestHandler,
);

// Verificar e concluir automaticamente exercício (se todas questões foram respondidas e aprovadas)
router.post(
  '/:userExercicioId/verificar-conclusao',
  verificarEConcluirExercicio as RequestHandler,
);

export { router as userExercicioRoutes };
