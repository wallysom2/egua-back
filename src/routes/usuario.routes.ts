import express, { Request, Response } from 'express';
import { autenticar, autorizarTipos } from '../middlewares/auth.middleware.js';
import { getSupabaseAdmin } from '../services/supabase.service.js';
import type { User } from '@supabase/supabase-js';

const router = express.Router();

/**
 * Rotas de gerenciamento de usuários (apenas para desenvolvedores)
 * Usa Supabase Admin API para gerenciar usuários
 */

// Listar todos os usuários
router.get('/', autenticar, autorizarTipos(['desenvolvedor']), async (req: Request, res: Response) => {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin.listAllUsers();

        if (error) {
            console.error('Erro ao listar usuários:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao listar usuários'
            });
            return;
        }

        // Mapear para formato simplificado
        const usuarios = data.users.map((user: User) => ({
            id: user.id,
            email: user.email || '',
            nome: user.user_metadata?.nome || user.user_metadata?.full_name || user.user_metadata?.name || 'Usuário',
            tipo: user.user_metadata?.tipo || 'aluno',
            created_at: user.created_at,
            updated_at: user.updated_at,
        }));

        res.json({
            success: true,
            data: usuarios
        });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar usuários'
        });
    }
});

// Obter um usuário específico
router.get('/:id', autenticar, autorizarTipos(['desenvolvedor']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin.getUserById(id);

        if (error || !data.user) {
            res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
            return;
        }

        const user = data.user;
        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email || '',
                nome: user.user_metadata?.nome || user.user_metadata?.full_name || 'Usuário',
                tipo: user.user_metadata?.tipo || 'aluno',
                created_at: user.created_at,
                updated_at: user.updated_at,
            }
        });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar usuário'
        });
    }
});

// Atualizar tipo de usuário
router.patch('/:id/tipo', autenticar, autorizarTipos(['desenvolvedor']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { tipo } = req.body;

        if (!['aluno', 'professor', 'desenvolvedor'].includes(tipo)) {
            res.status(400).json({
                success: false,
                message: 'Tipo de usuário inválido'
            });
            return;
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin.updateUserMetadata(id, { tipo });

        if (error) {
            console.error('Erro ao atualizar tipo de usuário:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar tipo de usuário'
            });
            return;
        }

        const user = data.user;
        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email || '',
                nome: user.user_metadata?.nome || user.user_metadata?.full_name || 'Usuário',
                tipo: user.user_metadata?.tipo || 'aluno',
            },
            message: 'Tipo de usuário atualizado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao atualizar tipo de usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar tipo de usuário'
        });
    }
});

// Excluir usuário
router.delete('/:id', autenticar, autorizarTipos(['desenvolvedor']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Verificar se não está tentando excluir a si mesmo
        if (req.usuario?.id === id) {
            res.status(400).json({
                success: false,
                message: 'Você não pode excluir sua própria conta'
            });
            return;
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin.deleteUser(id);

        if (error) {
            console.error('Erro ao excluir usuário:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao excluir usuário'
            });
            return;
        }

        res.json({
            success: true,
            message: 'Usuário excluído com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao excluir usuário'
        });
    }
});

export { router as usuarioRoutes };
