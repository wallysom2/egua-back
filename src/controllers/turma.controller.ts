import { Request, Response } from 'express';
import * as turmaService from '../services/turma.service.js';
import {
    criarTurmaSchema,
    atualizarTurmaSchema,
    entrarTurmaSchema,
    adicionarExercicioTurmaSchema,
    criarModuloSchema,
    atualizarModuloSchema,
    criarLicaoSchema,
    registrarProgressoSchema,
} from '../schema/turma.schema.js';

// =============================================
// CRUD DE TURMA
// =============================================

/**
 * Criar uma nova turma
 * POST /turmas
 */
export async function criarTurma(req: Request, res: Response): Promise<void> {
    try {
        const professorId = req.usuario?.id;
        if (!professorId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        // Validar dados
        const validacao = criarTurmaSchema.safeParse(req.body);
        if (!validacao.success) {
            res.status(400).json({
                message: 'Dados inválidos',
                errors: validacao.error.errors,
            });
            return;
        }

        const turma = await turmaService.criarTurma(professorId, validacao.data);
        res.status(201).json(turma);
    } catch (error) {
        console.error('[ERROR] Erro ao criar turma:', error);
        res.status(500).json({ message: 'Erro ao criar turma' });
    }
}

/**
 * Listar turmas do professor
 * GET /turmas
 */
export async function listarTurmasProfessor(req: Request, res: Response): Promise<void> {
    try {
        const professorId = req.usuario?.id;
        if (!professorId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        const turmas = await turmaService.listarTurmasProfessor(professorId);
        res.json(turmas);
    } catch (error) {
        console.error('[ERROR] Erro ao listar turmas:', error);
        res.status(500).json({ message: 'Erro ao listar turmas' });
    }
}

/**
 * Buscar turma por ID
 * GET /turmas/:id
 */
export async function buscarTurma(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.usuario?.id;
        const userTipo = req.usuario?.tipo;

        if (!userId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        // Se for professor ou desenvolvedor, verificar propriedade
        const professorId = userTipo === 'aluno' ? undefined : userId;
        const turma = await turmaService.buscarTurmaPorId(id as string, professorId);

        if (!turma) {
            res.status(404).json({ message: 'Turma não encontrada' });
            return;
        }

        res.json(turma);
    } catch (error) {
        console.error('[ERROR] Erro ao buscar turma:', error);
        res.status(500).json({ message: 'Erro ao buscar turma' });
    }
}

/**
 * Atualizar turma
 * PUT /turmas/:id
 */
export async function atualizarTurma(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const professorId = req.usuario?.id;

        if (!professorId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        const validacao = atualizarTurmaSchema.safeParse(req.body);
        if (!validacao.success) {
            res.status(400).json({
                message: 'Dados inválidos',
                errors: validacao.error.errors,
            });
            return;
        }

        const turma = await turmaService.atualizarTurma(id as string, professorId, validacao.data);

        if (!turma) {
            res.status(404).json({ message: 'Turma não encontrada' });
            return;
        }

        res.json(turma);
    } catch (error) {
        console.error('[ERROR] Erro ao atualizar turma:', error);
        res.status(500).json({ message: 'Erro ao atualizar turma' });
    }
}

/**
 * Desativar turma
 * DELETE /turmas/:id
 */
export async function desativarTurma(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.usuario?.id;
        const userTipo = req.usuario?.tipo;

        if (!userId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        // Desenvolvedores podem excluir qualquer turma
        // Professores só podem excluir suas próprias turmas
        const professorId = userTipo === 'desenvolvedor' ? undefined : userId;

        const turma = await turmaService.desativarTurma(id as string, professorId);

        if (!turma) {
            res.status(404).json({ message: 'Turma não encontrada ou sem permissão' });
            return;
        }

        res.json({ message: 'Turma desativada com sucesso' });
    } catch (error) {
        console.error('[ERROR] Erro ao desativar turma:', error);
        res.status(500).json({ message: 'Erro ao desativar turma' });
    }
}

// =============================================
// GERENCIAMENTO DE ALUNOS
// =============================================

/**
 * Entrar em uma turma via código
 * POST /turmas/entrar
 */
export async function entrarNaTurma(req: Request, res: Response): Promise<void> {
    try {
        console.log('[DEBUG] entrarNaTurma - Body recebido:', JSON.stringify(req.body));
        console.log('[DEBUG] entrarNaTurma - Usuario:', req.usuario);

        const alunoId = req.usuario?.id;
        if (!alunoId) {
            console.log('[DEBUG] entrarNaTurma - Usuário não autenticado');
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        const validacao = entrarTurmaSchema.safeParse(req.body);
        if (!validacao.success) {
            console.log('[DEBUG] entrarNaTurma - Validação falhou:', validacao.error.errors);
            res.status(400).json({
                message: 'Dados inválidos',
                errors: validacao.error.errors,
            });
            return;
        }

        console.log('[DEBUG] entrarNaTurma - Código validado:', validacao.data.codigo_acesso);

        const resultado = await turmaService.entrarNaTurma(
            alunoId,
            validacao.data.codigo_acesso
        );

        console.log('[DEBUG] entrarNaTurma - Resultado do service:', resultado);

        if (!resultado.success) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.json(resultado);
    } catch (error) {
        console.error('[ERROR] Erro ao entrar na turma:', error);
        res.status(500).json({ message: 'Erro ao entrar na turma' });
    }
}

/**
 * Listar turmas do aluno
 * GET /turmas/minhas
 */
export async function listarMinhasTurmas(req: Request, res: Response): Promise<void> {
    try {
        const alunoId = req.usuario?.id;
        if (!alunoId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        const turmas = await turmaService.listarTurmasAluno(alunoId);
        res.json(turmas);
    } catch (error) {
        console.error('[ERROR] Erro ao listar turmas do aluno:', error);
        res.status(500).json({ message: 'Erro ao listar turmas' });
    }
}

/**
 * Listar alunos de uma turma
 * GET /turmas/:id/alunos
 */
export async function listarAlunos(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const professorId = req.usuario?.id;

        if (!professorId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        const alunos = await turmaService.listarAlunosTurma(id as string, professorId);

        if (alunos === null) {
            res.status(404).json({ message: 'Turma não encontrada' });
            return;
        }

        res.json(alunos);
    } catch (error) {
        console.error('[ERROR] Erro ao listar alunos:', error);
        res.status(500).json({ message: 'Erro ao listar alunos' });
    }
}

/**
 * Remover aluno da turma
 * DELETE /turmas/:id/alunos/:alunoId
 */
export async function removerAluno(req: Request, res: Response): Promise<void> {
    try {
        const { id, alunoId } = req.params;
        const professorId = req.usuario?.id;

        if (!professorId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        const resultado = await turmaService.removerAlunoDaTurma(id as string, alunoId as string, professorId);

        if (!resultado.success) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.json(resultado);
    } catch (error) {
        console.error('[ERROR] Erro ao remover aluno:', error);
        res.status(500).json({ message: 'Erro ao remover aluno' });
    }
}

// =============================================
// GERENCIAMENTO DE EXERCÍCIOS
// =============================================

/**
 * Listar exercícios da turma
 * GET /turmas/:id/exercicios
 */
export async function listarExercicios(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const exercicios = await turmaService.listarExerciciosTurma(id as string);
        res.json(exercicios);
    } catch (error) {
        console.error('[ERROR] Erro ao listar exercícios:', error);
        res.status(500).json({ message: 'Erro ao listar exercícios' });
    }
}

/**
 * Adicionar exercício à turma
 * POST /turmas/:id/exercicios
 */
export async function adicionarExercicio(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const professorId = req.usuario?.id;

        if (!professorId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        const validacao = adicionarExercicioTurmaSchema.safeParse(req.body);
        if (!validacao.success) {
            res.status(400).json({
                message: 'Dados inválidos',
                errors: validacao.error.errors,
            });
            return;
        }

        const turmaExercicio = await turmaService.adicionarExercicioTurma(
            id as string,
            professorId,
            validacao.data
        );

        if (!turmaExercicio) {
            res.status(404).json({ message: 'Turma não encontrada' });
            return;
        }

        res.status(201).json(turmaExercicio);
    } catch (error: any) {
        console.error('[ERROR] Erro ao adicionar exercício:', error);
        res.status(500).json({ message: error.message || 'Erro ao adicionar exercício' });
    }
}

/**
 * Remover exercício da turma
 * DELETE /turmas/:id/exercicios/:exercicioId
 */
export async function removerExercicio(req: Request, res: Response): Promise<void> {
    try {
        const { id, exercicioId } = req.params;
        const professorId = req.usuario?.id;

        if (!professorId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        const resultado = await turmaService.removerExercicioTurma(
            id as string,
            parseInt(exercicioId as string),
            professorId
        );

        if (!resultado.success) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.json(resultado);
    } catch (error) {
        console.error('[ERROR] Erro ao remover exercício:', error);
        res.status(500).json({ message: 'Erro ao remover exercício' });
    }
}

// =============================================
// TRILHA DE APRENDIZADO
// =============================================

/**
 * Obter trilha de aprendizado
 * GET /turmas/:id/trilha
 */
export async function obterTrilha(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const trilha = await turmaService.obterTrilha(id as string);
        res.json(trilha);
    } catch (error) {
        console.error('[ERROR] Erro ao obter trilha:', error);
        res.status(500).json({ message: 'Erro ao obter trilha' });
    }
}

/**
 * Criar módulo na trilha
 * POST /turmas/:id/trilha/modulos
 */
export async function criarModulo(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const professorId = req.usuario?.id;

        if (!professorId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        const validacao = criarModuloSchema.safeParse(req.body);
        if (!validacao.success) {
            res.status(400).json({
                message: 'Dados inválidos',
                errors: validacao.error.errors,
            });
            return;
        }

        const modulo = await turmaService.criarModulo(id as string, professorId, validacao.data);

        if (!modulo) {
            res.status(404).json({ message: 'Turma não encontrada' });
            return;
        }

        res.status(201).json(modulo);
    } catch (error) {
        console.error('[ERROR] Erro ao criar módulo:', error);
        res.status(500).json({ message: 'Erro ao criar módulo' });
    }
}

/**
 * Atualizar módulo
 * PUT /turmas/:id/trilha/modulos/:moduloId
 */
export async function atualizarModulo(req: Request, res: Response): Promise<void> {
    try {
        const { moduloId } = req.params;
        const professorId = req.usuario?.id;

        if (!professorId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        const validacao = atualizarModuloSchema.safeParse(req.body);
        if (!validacao.success) {
            res.status(400).json({
                message: 'Dados inválidos',
                errors: validacao.error.errors,
            });
            return;
        }

        const modulo = await turmaService.atualizarModulo(moduloId as string, professorId, validacao.data);

        if (!modulo) {
            res.status(404).json({ message: 'Módulo não encontrado' });
            return;
        }

        res.json(modulo);
    } catch (error) {
        console.error('[ERROR] Erro ao atualizar módulo:', error);
        res.status(500).json({ message: 'Erro ao atualizar módulo' });
    }
}

/**
 * Remover módulo
 * DELETE /turmas/:id/trilha/modulos/:moduloId
 */
export async function removerModulo(req: Request, res: Response): Promise<void> {
    try {
        const { moduloId } = req.params;
        const professorId = req.usuario?.id;

        if (!professorId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        const resultado = await turmaService.removerModulo(moduloId as string, professorId);

        if (!resultado.success) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.json(resultado);
    } catch (error) {
        console.error('[ERROR] Erro ao remover módulo:', error);
        res.status(500).json({ message: 'Erro ao remover módulo' });
    }
}

/**
 * Criar lição em um módulo
 * POST /turmas/:id/trilha/modulos/:moduloId/licoes
 */
export async function criarLicao(req: Request, res: Response): Promise<void> {
    try {
        const { moduloId } = req.params;
        const professorId = req.usuario?.id;

        if (!professorId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        const validacao = criarLicaoSchema.safeParse(req.body);
        if (!validacao.success) {
            res.status(400).json({
                message: 'Dados inválidos',
                errors: validacao.error.errors,
            });
            return;
        }

        const licao = await turmaService.criarLicao(moduloId as string, professorId, validacao.data);

        if (!licao) {
            res.status(404).json({ message: 'Módulo não encontrado' });
            return;
        }

        res.status(201).json(licao);
    } catch (error: any) {
        console.error('[ERROR] Erro ao criar lição:', error);
        res.status(500).json({ message: error.message || 'Erro ao criar lição' });
    }
}

/**
 * Remover lição
 * DELETE /turmas/:id/trilha/licoes/:licaoId
 */
export async function removerLicao(req: Request, res: Response): Promise<void> {
    try {
        const { licaoId } = req.params;
        const professorId = req.usuario?.id;

        if (!professorId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        const resultado = await turmaService.removerLicao(licaoId as string, professorId);

        if (!resultado.success) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.json(resultado);
    } catch (error) {
        console.error('[ERROR] Erro ao remover lição:', error);
        res.status(500).json({ message: 'Erro ao remover lição' });
    }
}

// =============================================
// PROGRESSO DO ALUNO
// =============================================

/**
 * Obter progresso do aluno em uma turma
 * GET /turmas/:id/meu-progresso
 */
export async function obterMeuProgresso(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const alunoId = req.usuario?.id;

        if (!alunoId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        const progresso = await turmaService.obterProgressoAluno(id as string, alunoId as string);

        if (!progresso) {
            res.status(404).json({ message: 'Você não está matriculado nesta turma' });
            return;
        }

        res.json(progresso);
    } catch (error) {
        console.error('[ERROR] Erro ao obter progresso:', error);
        res.status(500).json({ message: 'Erro ao obter progresso' });
    }
}

/**
 * Registrar progresso em uma lição
 * POST /turmas/:id/progresso/:licaoId
 */
export async function registrarProgresso(req: Request, res: Response): Promise<void> {
    try {
        const { id, licaoId } = req.params;
        const alunoId = req.usuario?.id;

        if (!alunoId) {
            res.status(401).json({ message: 'Não autenticado' });
            return;
        }

        const validacao = registrarProgressoSchema.safeParse(req.body);
        if (!validacao.success) {
            res.status(400).json({
                message: 'Dados inválidos',
                errors: validacao.error.errors,
            });
            return;
        }

        const resultado = await turmaService.registrarProgresso(
            id as string,
            licaoId as string,
            alunoId as string,
            validacao.data
        );

        if (!resultado.success) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.json(resultado);
    } catch (error) {
        console.error('[ERROR] Erro ao registrar progresso:', error);
        res.status(500).json({ message: 'Erro ao registrar progresso' });
    }
}
