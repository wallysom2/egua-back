import express, { RequestHandler } from 'express';
import { validateRequest } from '../middlewares/validation.middlerare.js';
import { conteudoSchema } from '../schema/conteudo.schema.js';
import {
  listarConteudos,
  buscarConteudoPorId,
  criarConteudo,
  atualizarConteudo,
  deletarConteudo
} from '../controllers/conteudo.controller.js';
//import { autorizarProfessorOuDesenvolvedor } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', listarConteudos as RequestHandler);
router.get('/:id', buscarConteudoPorId as RequestHandler);
router.post('/', [ validateRequest(conteudoSchema), criarConteudo] as RequestHandler[]);
router.put('/:id', [validateRequest(conteudoSchema), atualizarConteudo] as RequestHandler[]);
router.delete('/:id', [ deletarConteudo] as RequestHandler[]);

export { router as conteudoRoutes }; 