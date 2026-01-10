import express, { Request, Response } from 'express';
import { autenticar } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * Rotas de autenticação - Supabase gerencia autenticação
 * 
 * As seguintes operações são feitas diretamente pelo frontend com o Supabase:
 * - Login com email/senha
 * - Cadastro de usuário
 * - Login com Google OAuth
 * - Recuperação de senha
 * - Redefinição de senha
 * 
 * Este arquivo é mantido para rotas auxiliares que possam ser necessárias
 */

// Health check da autenticação
router.get('/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Auth service health check OK',
        provider: 'supabase'
    });
});

// Rota para obter informações do usuário logado
// O middleware de autenticação já extrai as informações do token
router.get('/me', autenticar, (req: Request, res: Response) => {
    if (!req.usuario) {
        res.status(401).json({
            success: false,
            message: 'Não autenticado'
        });
        return;
    }

    res.json({
        success: true,
        data: {
            usuario: {
                id: req.usuario.id,
                email: req.usuario.email,
                nome: req.usuario.nome,
                tipo: req.usuario.tipo
            }
        }
    });
});

export { router as authRoutes };