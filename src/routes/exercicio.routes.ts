import express, { RequestHandler } from 'express';
import { validateRequest } from '../middlewares/validation.middlerare.js';
import { exercicioSchema } from '../schema/exercicio.schema.js';
import {
  listarExercicios,
  buscarExercicioPorId,
  criarExercicio,
  atualizarExercicio,
  deletarExercicio
} from '../controllers/exercicio.controller.js';
import { autorizarProfessor } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', listarExercicios as RequestHandler); // Adicionar ?linguagemId=X para filtrar
router.get('/:id', buscarExercicioPorId as RequestHandler);
router.post('/', [autorizarProfessor, validateRequest(exercicioSchema), criarExercicio] as RequestHandler[]);
router.put('/:id', [autorizarProfessor, validateRequest(exercicioSchema), atualizarExercicio] as RequestHandler[]);
router.delete('/:id', [autorizarProfessor, deletarExercicio] as RequestHandler[]);

export { router as exercicioRoutes }; 