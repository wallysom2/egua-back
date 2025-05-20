import express, { RequestHandler } from 'express';
import { validateRequest } from '../middlewares/validation.middlerare.js';
import { iaCriterioSchema } from '../schema/iaCriterio.schema.js';
import {
  listarIaCriterios,
  buscarIaCriterioPorId,
  criarIaCriterio,
  atualizarIaCriterio,
  deletarIaCriterio
} from '../controllers/iaCriterio.controller.js';
import { autorizarProfessor } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', [autorizarProfessor, listarIaCriterios] as RequestHandler[]);
router.get('/:id', [autorizarProfessor, buscarIaCriterioPorId] as RequestHandler[]);
router.post('/', [autorizarProfessor, validateRequest(iaCriterioSchema), criarIaCriterio] as RequestHandler[]);
router.put('/:id', [autorizarProfessor, validateRequest(iaCriterioSchema), atualizarIaCriterio] as RequestHandler[]);
router.delete('/:id', [autorizarProfessor, deletarIaCriterio] as RequestHandler[]);

export { router as iaCriterioRoutes }; 