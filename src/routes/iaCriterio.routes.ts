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

const router = express.Router();

router.get('/', [ listarIaCriterios] as RequestHandler[]);
router.get('/:id', [ buscarIaCriterioPorId] as RequestHandler[]);
router.post('/', [ validateRequest(iaCriterioSchema), criarIaCriterio] as RequestHandler[]);
router.put('/:id', [ validateRequest(iaCriterioSchema), atualizarIaCriterio] as RequestHandler[]);
router.delete('/:id', [ deletarIaCriterio] as RequestHandler[]);

export { router as iaCriterioRoutes }; 