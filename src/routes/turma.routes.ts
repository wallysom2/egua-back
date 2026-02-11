import { Router } from 'express';
import {
    autorizarProfessorOuDesenvolvedor,
    autorizarTipos,
} from '../middlewares/auth.middleware.js';
import * as turmaController from '../controllers/turma.controller.js';

const router = Router();

// =============================================
// ROTAS PARA TRILHA INICIAL (TURMA PADRÃO)
// =============================================

// Obter trilha inicial do aluno (turma padrão com progresso)
router.get('/trilha-inicial', turmaController.obterTrilhaInicial);

// Obter informações da turma padrão
router.get('/padrao', turmaController.obterTurmaPadrao);

// Definir turma como padrão (apenas desenvolvedores)
router.post(
    '/:id/definir-padrao',
    autorizarTipos(['desenvolvedor']),
    turmaController.definirTurmaPadrao
);

// =============================================
// ROTAS PÚBLICAS PARA ALUNOS
// =============================================

// Entrar em uma turma via código de acesso
router.post('/entrar', turmaController.entrarNaTurma);

// Listar turmas do aluno logado
router.get('/minhas', turmaController.listarMinhasTurmas);

// Obter progresso do aluno em uma turma
router.get('/:id/meu-progresso', turmaController.obterMeuProgresso);

// Registrar progresso em uma lição
router.post('/:id/progresso/:licaoId', turmaController.registrarProgresso);

// =============================================
// ROTAS PARA PROFESSORES/DESENVOLVEDORES
// =============================================

// CRUD de Turmas
router.get('/', autorizarProfessorOuDesenvolvedor, turmaController.listarTurmasProfessor);
router.post('/', autorizarProfessorOuDesenvolvedor, turmaController.criarTurma);
router.get('/:id', turmaController.buscarTurma); // Alunos também podem ver a turma
router.put('/:id', autorizarProfessorOuDesenvolvedor, turmaController.atualizarTurma);
router.delete('/:id', autorizarProfessorOuDesenvolvedor, turmaController.desativarTurma);

// Gerenciamento de Alunos
router.get('/:id/alunos', autorizarProfessorOuDesenvolvedor, turmaController.listarAlunos);
router.delete(
    '/:id/alunos/:alunoId',
    autorizarProfessorOuDesenvolvedor,
    turmaController.removerAluno
);

// Gerenciamento de Exercícios da Turma
router.get('/:id/exercicios', turmaController.listarExercicios);
router.post(
    '/:id/exercicios',
    autorizarProfessorOuDesenvolvedor,
    turmaController.adicionarExercicio
);
router.delete(
    '/:id/exercicios/:exercicioId',
    autorizarProfessorOuDesenvolvedor,
    turmaController.removerExercicio
);

// Trilha de Aprendizado
router.get('/:id/trilha', turmaController.obterTrilha);
router.post(
    '/:id/trilha/modulos',
    autorizarProfessorOuDesenvolvedor,
    turmaController.criarModulo
);
router.put(
    '/:id/trilha/modulos/:moduloId',
    autorizarProfessorOuDesenvolvedor,
    turmaController.atualizarModulo
);
router.delete(
    '/:id/trilha/modulos/:moduloId',
    autorizarProfessorOuDesenvolvedor,
    turmaController.removerModulo
);
router.post(
    '/:id/trilha/modulos/:moduloId/licoes',
    autorizarProfessorOuDesenvolvedor,
    turmaController.criarLicao
);
router.delete(
    '/:id/trilha/licoes/:licaoId',
    autorizarProfessorOuDesenvolvedor,
    turmaController.removerLicao
);

export { router as turmaRoutes };
