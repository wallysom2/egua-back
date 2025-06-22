import express, { RequestHandler } from 'express';
import { validateRequest } from '../middlewares/validation.middlerare.js';
import { submeterRespostaSchema } from '../schema/userResposta.schema.js';
import {
  submeterResposta,
  listarRespostasPorProgresso,
  obterAnaliseResposta,
} from '../controllers/userResposta.controller.js';

const router = express.Router();

// Usuário submete uma resposta para uma questão de um exercício
router.post('/', [
  validateRequest(submeterRespostaSchema),
  submeterResposta,
] as RequestHandler[]);

// Lista respostas de um progresso de exercício específico do usuário logado
router.get(
  '/progresso/:userExercicioId',
  listarRespostasPorProgresso as RequestHandler,
);

// Obter análise de uma resposta específica (para questões de programação)
router.get('/analise/:respostaId', obterAnaliseResposta as RequestHandler);

export { router as userRespostaRoutes };
