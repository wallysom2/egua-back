import express from 'express';
import { cadastro, login, solicitarRecuperacao, redefinirSenha, validarToken } from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validation.middlerare.js';
import { cadastroSchema, loginSchema } from '../schema/usuario.schema.js';

const router = express.Router();

router.post('/cadastro', cadastro);

router.post('/login', login);

// Rotas de recuperação de senha
router.post('/solicitar-recuperacao', solicitarRecuperacao);
router.post('/redefinir-senha', redefinirSenha);
router.get('/validar-token/:token', validarToken);

export { router as authRoutes }; 