import express from 'express';
import { cadastro, login } from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validation.middlerare.js';
import { cadastroSchema, loginSchema } from '../schema/usuario.schema.js';

const router = express.Router();

router.post('/cadastro', cadastro);

router.post('/login', login);

export { router as authRoutes }; 