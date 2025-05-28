import express, { RequestHandler } from 'express';
import { validateRequest } from '../middlewares/validation.middlerare.js';
import { questaoSchema } from '../schema/questao.schema.js';
import {
  listarQuestoes,
  buscarQuestaoPorId,
  criarQuestao,
  atualizarQuestao,
  deletarQuestao
} from '../controllers/questao.controller.js';

const router = express.Router();

router.get('/', listarQuestoes as RequestHandler); // Adicionar ?conteudoId=X para filtrar
router.get('/:id', buscarQuestaoPorId as RequestHandler);
router.post('/', validateRequest(questaoSchema), criarQuestao as RequestHandler);
router.put('/:id', validateRequest(questaoSchema), atualizarQuestao as RequestHandler);
router.delete('/:id', deletarQuestao as RequestHandler);

export { router as questaoRoutes }; 