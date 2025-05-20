import express, { RequestHandler } from 'express';
import { validateRequest } from '../middlewares/validation.middlerare.js';
import { linguagemSchema } from '../schema/linguagem.schema.js';
import {
  listarLinguagens,
  buscarLinguagemPorId,
  criarLinguagem,
  atualizarLinguagem,
  deletarLinguagem
} from '../controllers/linguagem.controller.js';
import { autorizarProfessor } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', listarLinguagens as RequestHandler);
router.get('/:id', buscarLinguagemPorId as RequestHandler);
router.post('/', [autorizarProfessor, validateRequest(linguagemSchema), criarLinguagem] as RequestHandler[]);
router.put('/:id', [autorizarProfessor, validateRequest(linguagemSchema), atualizarLinguagem] as RequestHandler[]);
router.delete('/:id', [autorizarProfessor, deletarLinguagem] as RequestHandler[]);

export { router as linguagemRoutes }; 