import express, { RequestHandler } from 'express';
import { validateRequest } from '../middlewares/validation.middlerare.js';
import { exercicioSchema } from '../schema/exercicio.schema.js';
import {
  listarExercicios,
  buscarExercicioPorId,
  criarExercicio,
  atualizarExercicio,
  deletarExercicio,
  submeterExercicio
} from '../controllers/exercicio.controller.js';

const router = express.Router();

router.get('/', listarExercicios as RequestHandler); // Adicionar ?linguagemId=X para filtrar
router.get('/:id', buscarExercicioPorId as RequestHandler);
router.post('/', [validateRequest(exercicioSchema), criarExercicio] as RequestHandler[]);
router.post('/:id/submit', submeterExercicio as RequestHandler); // Submeter/finalizar exercício
router.put('/:id', [validateRequest(exercicioSchema), atualizarExercicio] as RequestHandler[]);
router.delete('/:id', [deletarExercicio] as RequestHandler[]);

export { router as exercicioRoutes }; 