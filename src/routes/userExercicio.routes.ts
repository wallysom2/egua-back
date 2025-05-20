import express, { RequestHandler } from 'express';
import { validateRequest } from '../middlewares/validation.middlerare.js';
import { iniciarExercicioSchema, finalizarExercicioSchema } from '../schema/userExercicio.schema.js';
import {
  iniciarExercicio,
  finalizarExercicio,
  listarProgressoUsuario
} from '../controllers/userExercicio.controller.js';

const router = express.Router();

// Lista o progresso de exercícios do usuário logado
router.get('/meu-progresso', listarProgressoUsuario as RequestHandler);

// Usuário inicia um exercício
router.post('/iniciar', [validateRequest(iniciarExercicioSchema), iniciarExercicio] as RequestHandler[]);

// Usuário finaliza um exercício (userExercicioId é o ID da tabela user_exercicio)
router.patch('/:userExercicioId/finalizar', [validateRequest(finalizarExercicioSchema), finalizarExercicio] as RequestHandler[]);

export { router as userExercicioRoutes }; 