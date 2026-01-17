import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/database.js';
import { logger } from '../utils/logger.js';
import type {
    CriarTurmaInput,
    AtualizarTurmaInput,
    AdicionarExercicioTurmaInput,
    CriarModuloInput,
    AtualizarModuloInput,
    CriarLicaoInput,
    RegistrarProgressoInput,
} from '../schema/turma.schema.js';

// =============================================
// INTERFACES DE TIPAGEM
// =============================================

interface ProgressoRecord {
    xp_ganho: number;
    completado: boolean;
    pontuacao: number;
    tentativas: number;
}

interface MatriculaComProgresso {
    id: string;
    turma_id: string;
    aluno_id: string;
    matriculado_em: Date;
    ativo: boolean;
    turma: {
        id: string;
        nome: string;
        descricao: string | null;
        codigo_acesso: string;
        professor_id: string;
        ativo: boolean;
        created_at: Date;
        updated_at: Date;
        _count: {
            trilha_modulo: number;
        };
    };
    progresso: ProgressoRecord[];
}

interface AlunoComProgresso {
    id: string;
    turma_id: string;
    aluno_id: string;
    matriculado_em: Date;
    ativo: boolean;
    progresso: ProgressoRecord[];
}

interface ModuloComLicoes {
    id: string;
    turma_id: string;
    titulo: string;
    descricao: string | null;
    icone: string | null;
    ordem: number;
    xp_recompensa: number;
    ativo: boolean;
    created_at: Date;
    updated_at: Date;
    trilha_licao: LicaoComProgresso[];
}

interface LicaoComProgresso {
    id: string;
    modulo_id: string;
    exercicio_id: number;
    ordem: number;
    xp_recompensa: number;
    created_at: Date;
    exercicio: {
        id: number;
        titulo: string;
    };
    progresso: ProgressoRecord[];
}

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

/**
 * Gera um código de acesso único de 8 caracteres
 */
function gerarCodigoAcesso(): string {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 4; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
}

/**
 * Gera um código único verificando se já existe no banco
 */
async function gerarCodigoUnico(): Promise<string> {
    let codigo = gerarCodigoAcesso();
    let tentativas = 0;
    const maxTentativas = 10;

    while (tentativas < maxTentativas) {
        const existente = await prisma.turma.findUnique({
            where: { codigo_acesso: codigo },
        });

        if (!existente) {
            return codigo;
        }

        codigo = gerarCodigoAcesso();
        tentativas++;
    }

    throw new Error('Não foi possível gerar um código único');
}

// =============================================
// CRUD DE TURMA
// =============================================

/**
 * Criar uma nova turma
 */
export async function criarTurma(professorId: string, dados: CriarTurmaInput) {
    try {
        const codigoAcesso = await gerarCodigoUnico();

        const turma = await prisma.turma.create({
            data: {
                id: uuidv4(),
                nome: dados.nome,
                descricao: dados.descricao,
                codigo_acesso: codigoAcesso,
                professor_id: professorId,
            },
        });

        logger.info(`Turma criada: ${turma.id} por professor ${professorId}`);
        return turma;
    } catch (error) {
        logger.error('Erro ao criar turma:', error);
        throw error;
    }
}

/**
 * Listar turmas de um professor
 */
export async function listarTurmasProfessor(professorId: string) {
    try {
        const turmas = await prisma.turma.findMany({
            where: {
                professor_id: professorId,
                ativo: true,
            },
            include: {
                _count: {
                    select: {
                        turma_aluno: { where: { ativo: true } },
                        turma_exercicio: true,
                        trilha_modulo: { where: { ativo: true } },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        return turmas;
    } catch (error) {
        logger.error('Erro ao listar turmas do professor:', error);
        throw error;
    }
}

/**
 * Buscar turma por ID
 */
export async function buscarTurmaPorId(turmaId: string, professorId?: string) {
    try {
        const turma = await prisma.turma.findUnique({
            where: { id: turmaId },
            include: {
                _count: {
                    select: {
                        turma_aluno: { where: { ativo: true } },
                        turma_exercicio: true,
                        trilha_modulo: { where: { ativo: true } },
                    },
                },
                trilha_modulo: {
                    where: { ativo: true },
                    orderBy: { ordem: 'asc' },
                    include: {
                        trilha_licao: {
                            orderBy: { ordem: 'asc' },
                            include: {
                                exercicio: {
                                    select: { id: true, titulo: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Se professorId foi fornecido, verificar se é o dono
        if (professorId && turma && turma.professor_id !== professorId) {
            return null;
        }

        return turma;
    } catch (error) {
        logger.error('Erro ao buscar turma:', error);
        throw error;
    }
}

/**
 * Atualizar turma
 */
export async function atualizarTurma(
    turmaId: string,
    professorId: string,
    dados: AtualizarTurmaInput
) {
    try {
        // Verificar se o professor é o dono
        const turmaExistente = await prisma.turma.findFirst({
            where: { id: turmaId, professor_id: professorId },
        });

        if (!turmaExistente) {
            return null;
        }

        const turma = await prisma.turma.update({
            where: { id: turmaId },
            data: {
                ...dados,
                updated_at: new Date(),
            },
        });

        logger.info(`Turma atualizada: ${turmaId}`);
        return turma;
    } catch (error) {
        logger.error('Erro ao atualizar turma:', error);
        throw error;
    }
}

/**
 * Desativar turma (soft delete)
 * Se professorId for undefined, pula verificação de proprietário (dev mode)
 */
export async function desativarTurma(turmaId: string, professorId?: string) {
    try {
        // Se professorId foi fornecido, verifica propriedade
        if (professorId) {
            const turma = await atualizarTurma(turmaId, professorId, { ativo: false });
            if (turma) {
                logger.info(`Turma desativada: ${turmaId} pelo professor ${professorId}`);
            }
            return turma;
        }

        // Modo desenvolvedor: desativa diretamente
        const turma = await prisma.turma.update({
            where: { id: turmaId },
            data: { ativo: false, updated_at: new Date() },
        });

        logger.info(`Turma desativada: ${turmaId} (modo desenvolvedor)`);
        return turma;
    } catch (error) {
        logger.error('Erro ao desativar turma:', error);
        throw error;
    }
}

// =============================================
// GERENCIAMENTO DE ALUNOS
// =============================================

/**
 * Entrar em uma turma via código de acesso
 */
export async function entrarNaTurma(alunoId: string, codigoAcesso: string) {
    try {
        logger.info(`Tentando entrar na turma com código: "${codigoAcesso}" (length: ${codigoAcesso.length})`);

        // Buscar turma pelo código (garantir uppercase e sem espaços)
        const codigoNormalizado = codigoAcesso.trim().toUpperCase();
        logger.info(`Código normalizado: "${codigoNormalizado}"`);

        const turma = await prisma.turma.findUnique({
            where: { codigo_acesso: codigoNormalizado },
        });

        if (!turma) {
            logger.warn(`Turma não encontrada para código: "${codigoNormalizado}"`);
            return { success: false, message: 'Código de acesso inválido' };
        }

        if (!turma.ativo) {
            return { success: false, message: 'Esta turma não está mais ativa' };
        }

        // Verificar se já está matriculado
        const matriculaExistente = await prisma.turma_aluno.findUnique({
            where: {
                turma_id_aluno_id: {
                    turma_id: turma.id,
                    aluno_id: alunoId,
                },
            },
        });

        if (matriculaExistente) {
            if (matriculaExistente.ativo) {
                return { success: false, message: 'Você já está matriculado nesta turma' };
            }
            // Reativar matrícula
            await prisma.turma_aluno.update({
                where: { id: matriculaExistente.id },
                data: { ativo: true, matriculado_em: new Date() },
            });
            return { success: true, message: 'Matrícula reativada com sucesso', turma };
        }

        // Criar matrícula
        await prisma.turma_aluno.create({
            data: {
                id: uuidv4(),
                turma_id: turma.id,
                aluno_id: alunoId,
            },
        });

        logger.info(`Aluno ${alunoId} matriculado na turma ${turma.id}`);
        return { success: true, message: 'Matriculado com sucesso!', turma };
    } catch (error) {
        logger.error('Erro ao entrar na turma:', error);
        throw error;
    }
}

/**
 * Listar turmas de um aluno
 */
export async function listarTurmasAluno(alunoId: string) {
    try {
        const matriculas = await prisma.turma_aluno.findMany({
            where: {
                aluno_id: alunoId,
                ativo: true,
                turma: { ativo: true },
            },
            include: {
                turma: {
                    include: {
                        _count: {
                            select: {
                                trilha_modulo: { where: { ativo: true } },
                            },
                        },
                    },
                },
                progresso: {
                    where: { completado: true },
                },
            },
            orderBy: { matriculado_em: 'desc' },
        });

        // Calcular progresso de cada turma
        const turmasComProgresso = await Promise.all(
            matriculas.map(async (m: MatriculaComProgresso) => {
                const totalLicoes = await prisma.trilha_licao.count({
                    where: {
                        modulo: {
                            turma_id: m.turma_id,
                            ativo: true,
                        },
                    },
                });

                const licoesCompletadas = m.progresso.length;
                const xpTotal = m.progresso.reduce((acc: number, p: ProgressoRecord) => acc + p.xp_ganho, 0);

                return {
                    ...m.turma,
                    matriculado_em: m.matriculado_em,
                    progresso: {
                        total: totalLicoes,
                        completadas: licoesCompletadas,
                        percentual: totalLicoes > 0 ? Math.round((licoesCompletadas / totalLicoes) * 100) : 0,
                        xp_total: xpTotal,
                    },
                };
            })
        );

        return turmasComProgresso;
    } catch (error) {
        logger.error('Erro ao listar turmas do aluno:', error);
        throw error;
    }
}

/**
 * Listar alunos de uma turma
 */
export async function listarAlunosTurma(turmaId: string, professorId: string) {
    try {
        // Verificar se o professor é o dono
        const turma = await prisma.turma.findFirst({
            where: { id: turmaId, professor_id: professorId },
        });

        if (!turma) {
            return null;
        }

        const alunos = await prisma.turma_aluno.findMany({
            where: {
                turma_id: turmaId,
                ativo: true,
            },
            include: {
                progresso: true,
            },
            orderBy: { matriculado_em: 'desc' },
        });

        // Calcular estatísticas de cada aluno
        const totalLicoes = await prisma.trilha_licao.count({
            where: {
                modulo: {
                    turma_id: turmaId,
                    ativo: true,
                },
            },
        });

        // Importar o serviço Supabase para buscar dados dos usuários
        const { getSupabaseAdmin } = await import('./supabase.service.js');
        const supabaseAdmin = getSupabaseAdmin();

        // Buscar dados de todos os usuários em paralelo
        const alunosComDados = await Promise.all(
            alunos.map(async (a: AlunoComProgresso) => {
                const licoesCompletadas = a.progresso.filter((p: ProgressoRecord) => p.completado).length;
                const xpTotal = a.progresso.reduce((acc: number, p: ProgressoRecord) => acc + p.xp_ganho, 0);

                // Buscar dados do usuário no Supabase
                let usuario = {
                    nome: 'Usuário',
                    email: '',
                    avatar_url: null as string | null,
                };

                try {
                    const { data: userData, error } = await supabaseAdmin.getUserById(a.aluno_id);
                    if (!error && userData?.user) {
                        const meta = userData.user.user_metadata || {};
                        usuario = {
                            nome: meta.nome || meta.full_name || meta.name || 'Usuário',
                            email: userData.user.email || '',
                            avatar_url: meta.avatar_url || meta.picture || null,
                        };
                    }
                } catch (err) {
                    logger.warn(`Não foi possível buscar dados do usuário ${a.aluno_id}:`, err);
                }

                return {
                    id: a.id,
                    aluno_id: a.aluno_id,
                    matriculado_em: a.matriculado_em,
                    usuario,
                    estatisticas: {
                        licoes_completadas: licoesCompletadas,
                        total_licoes: totalLicoes,
                        percentual: totalLicoes > 0 ? Math.round((licoesCompletadas / totalLicoes) * 100) : 0,
                        xp_total: xpTotal,
                    },
                };
            })
        );

        return alunosComDados;
    } catch (error) {
        logger.error('Erro ao listar alunos da turma:', error);
        throw error;
    }
}

/**
 * Remover aluno da turma
 */
export async function removerAlunoDaTurma(
    turmaId: string,
    alunoId: string,
    professorId: string
) {
    try {
        // Verificar se o professor é o dono
        const turma = await prisma.turma.findFirst({
            where: { id: turmaId, professor_id: professorId },
        });

        if (!turma) {
            return { success: false, message: 'Turma não encontrada' };
        }

        const matricula = await prisma.turma_aluno.findUnique({
            where: {
                turma_id_aluno_id: {
                    turma_id: turmaId,
                    aluno_id: alunoId,
                },
            },
        });

        if (!matricula) {
            return { success: false, message: 'Aluno não está matriculado nesta turma' };
        }

        await prisma.turma_aluno.update({
            where: { id: matricula.id },
            data: { ativo: false },
        });

        logger.info(`Aluno ${alunoId} removido da turma ${turmaId}`);
        return { success: true, message: 'Aluno removido com sucesso' };
    } catch (error) {
        logger.error('Erro ao remover aluno da turma:', error);
        throw error;
    }
}

// =============================================
// GERENCIAMENTO DE EXERCÍCIOS DA TURMA
// =============================================

/**
 * Listar exercícios de uma turma
 */
export async function listarExerciciosTurma(turmaId: string) {
    try {
        const exercicios = await prisma.turma_exercicio.findMany({
            where: { turma_id: turmaId },
            include: {
                exercicio: {
                    include: {
                        linguagem: { select: { id: true, nome: true } },
                    },
                },
            },
            orderBy: { ordem: 'asc' },
        });

        return exercicios;
    } catch (error) {
        logger.error('Erro ao listar exercícios da turma:', error);
        throw error;
    }
}

/**
 * Adicionar exercício à turma
 */
export async function adicionarExercicioTurma(
    turmaId: string,
    professorId: string,
    dados: AdicionarExercicioTurmaInput
) {
    try {
        // Verificar se o professor é o dono
        const turma = await prisma.turma.findFirst({
            where: { id: turmaId, professor_id: professorId },
        });

        if (!turma) {
            return null;
        }

        // Verificar se o exercício existe
        const exercicio = await prisma.exercicio.findUnique({
            where: { id: dados.exercicio_id },
        });

        if (!exercicio) {
            throw new Error('Exercício não encontrado');
        }

        // Verificar se já está associado
        const existente = await prisma.turma_exercicio.findUnique({
            where: {
                turma_id_exercicio_id: {
                    turma_id: turmaId,
                    exercicio_id: dados.exercicio_id,
                },
            },
        });

        if (existente) {
            throw new Error('Exercício já está associado a esta turma');
        }

        const turmaExercicio = await prisma.turma_exercicio.create({
            data: {
                id: uuidv4(),
                turma_id: turmaId,
                exercicio_id: dados.exercicio_id,
                ordem: dados.ordem,
                obrigatorio: dados.obrigatorio,
            },
            include: {
                exercicio: true,
            },
        });

        logger.info(`Exercício ${dados.exercicio_id} adicionado à turma ${turmaId}`);
        return turmaExercicio;
    } catch (error) {
        logger.error('Erro ao adicionar exercício à turma:', error);
        throw error;
    }
}

/**
 * Remover exercício da turma
 */
export async function removerExercicioTurma(
    turmaId: string,
    exercicioId: number,
    professorId: string
) {
    try {
        // Verificar se o professor é o dono
        const turma = await prisma.turma.findFirst({
            where: { id: turmaId, professor_id: professorId },
        });

        if (!turma) {
            return { success: false, message: 'Turma não encontrada' };
        }

        const turmaExercicio = await prisma.turma_exercicio.findUnique({
            where: {
                turma_id_exercicio_id: {
                    turma_id: turmaId,
                    exercicio_id: exercicioId,
                },
            },
        });

        if (!turmaExercicio) {
            return { success: false, message: 'Exercício não está associado a esta turma' };
        }

        await prisma.turma_exercicio.delete({
            where: { id: turmaExercicio.id },
        });

        logger.info(`Exercício ${exercicioId} removido da turma ${turmaId}`);
        return { success: true, message: 'Exercício removido com sucesso' };
    } catch (error) {
        logger.error('Erro ao remover exercício da turma:', error);
        throw error;
    }
}

// =============================================
// TRILHA DE APRENDIZADO
// =============================================

/**
 * Obter trilha de aprendizado de uma turma
 */
export async function obterTrilha(turmaId: string) {
    try {
        const modulos = await prisma.trilha_modulo.findMany({
            where: {
                turma_id: turmaId,
                ativo: true,
            },
            include: {
                trilha_licao: {
                    orderBy: { ordem: 'asc' },
                    include: {
                        exercicio: {
                            select: { id: true, titulo: true },
                        },
                    },
                },
            },
            orderBy: { ordem: 'asc' },
        });

        return modulos;
    } catch (error) {
        logger.error('Erro ao obter trilha:', error);
        throw error;
    }
}

/**
 * Criar módulo na trilha
 */
export async function criarModulo(
    turmaId: string,
    professorId: string,
    dados: CriarModuloInput
) {
    try {
        // Verificar se o professor é o dono
        const turma = await prisma.turma.findFirst({
            where: { id: turmaId, professor_id: professorId },
        });

        if (!turma) {
            return null;
        }

        const modulo = await prisma.trilha_modulo.create({
            data: {
                id: uuidv4(),
                turma_id: turmaId,
                titulo: dados.titulo,
                descricao: dados.descricao,
                icone: dados.icone,
                ordem: dados.ordem,
                xp_recompensa: dados.xp_recompensa,
            },
        });

        logger.info(`Módulo ${modulo.id} criado na turma ${turmaId}`);
        return modulo;
    } catch (error) {
        logger.error('Erro ao criar módulo:', error);
        throw error;
    }
}

/**
 * Atualizar módulo
 */
export async function atualizarModulo(
    moduloId: string,
    professorId: string,
    dados: AtualizarModuloInput
) {
    try {
        // Verificar se o módulo existe e pertence ao professor
        const modulo = await prisma.trilha_modulo.findFirst({
            where: { id: moduloId },
            include: { turma: true },
        });

        if (!modulo || modulo.turma.professor_id !== professorId) {
            return null;
        }

        const moduloAtualizado = await prisma.trilha_modulo.update({
            where: { id: moduloId },
            data: dados,
        });

        logger.info(`Módulo ${moduloId} atualizado`);
        return moduloAtualizado;
    } catch (error) {
        logger.error('Erro ao atualizar módulo:', error);
        throw error;
    }
}

/**
 * Remover módulo
 */
export async function removerModulo(moduloId: string, professorId: string) {
    try {
        const modulo = await prisma.trilha_modulo.findFirst({
            where: { id: moduloId },
            include: { turma: true },
        });

        if (!modulo || modulo.turma.professor_id !== professorId) {
            return { success: false, message: 'Módulo não encontrado' };
        }

        // Soft delete
        await prisma.trilha_modulo.update({
            where: { id: moduloId },
            data: { ativo: false },
        });

        logger.info(`Módulo ${moduloId} removido`);
        return { success: true, message: 'Módulo removido com sucesso' };
    } catch (error) {
        logger.error('Erro ao remover módulo:', error);
        throw error;
    }
}

/**
 * Criar lição em um módulo
 */
export async function criarLicao(
    moduloId: string,
    professorId: string,
    dados: CriarLicaoInput
) {
    try {
        // Verificar se o módulo existe e pertence ao professor
        const modulo = await prisma.trilha_modulo.findFirst({
            where: { id: moduloId },
            include: { turma: true },
        });

        if (!modulo || modulo.turma.professor_id !== professorId) {
            return null;
        }

        // Verificar se o exercício existe
        const exercicio = await prisma.exercicio.findUnique({
            where: { id: dados.exercicio_id },
        });

        if (!exercicio) {
            throw new Error('Exercício não encontrado');
        }

        const licao = await prisma.trilha_licao.create({
            data: {
                id: uuidv4(),
                modulo_id: moduloId,
                exercicio_id: dados.exercicio_id,
                ordem: dados.ordem,
                xp_recompensa: dados.xp_recompensa,
            },
            include: {
                exercicio: { select: { id: true, titulo: true } },
            },
        });

        logger.info(`Lição ${licao.id} criada no módulo ${moduloId}`);
        return licao;
    } catch (error) {
        logger.error('Erro ao criar lição:', error);
        throw error;
    }
}

/**
 * Remover lição
 */
export async function removerLicao(licaoId: string, professorId: string) {
    try {
        const licao = await prisma.trilha_licao.findFirst({
            where: { id: licaoId },
            include: {
                modulo: {
                    include: { turma: true },
                },
            },
        });

        if (!licao || licao.modulo.turma.professor_id !== professorId) {
            return { success: false, message: 'Lição não encontrada' };
        }

        await prisma.trilha_licao.delete({
            where: { id: licaoId },
        });

        logger.info(`Lição ${licaoId} removida`);
        return { success: true, message: 'Lição removida com sucesso' };
    } catch (error) {
        logger.error('Erro ao remover lição:', error);
        throw error;
    }
}

// =============================================
// PROGRESSO DO ALUNO
// =============================================

/**
 * Obter progresso do aluno em uma turma
 */
export async function obterProgressoAluno(turmaId: string, alunoId: string) {
    try {
        // Buscar matrícula do aluno
        const matricula = await prisma.turma_aluno.findUnique({
            where: {
                turma_id_aluno_id: {
                    turma_id: turmaId,
                    aluno_id: alunoId,
                },
            },
        });

        if (!matricula || !matricula.ativo) {
            return null;
        }

        // Buscar trilha com progresso
        const modulos = await prisma.trilha_modulo.findMany({
            where: {
                turma_id: turmaId,
                ativo: true,
            },
            include: {
                trilha_licao: {
                    orderBy: { ordem: 'asc' },
                    include: {
                        exercicio: {
                            select: { id: true, titulo: true },
                        },
                        progresso: {
                            where: { turma_aluno_id: matricula.id },
                        },
                    },
                },
            },
            orderBy: { ordem: 'asc' },
        });

        // Calcular estatísticas
        let totalLicoes = 0;
        let licoesCompletadas = 0;
        let xpTotal = 0;

        const modulosComStatus = modulos.map((modulo: ModuloComLicoes) => {
            let moduloCompletado = true;
            const licoesComStatus = modulo.trilha_licao.map((licao: LicaoComProgresso) => {
                totalLicoes++;
                const progresso = licao.progresso[0];
                const completada = progresso?.completado || false;

                if (completada) {
                    licoesCompletadas++;
                    xpTotal += progresso.xp_ganho;
                } else {
                    moduloCompletado = false;
                }

                return {
                    id: licao.id,
                    exercicio: licao.exercicio,
                    ordem: licao.ordem,
                    xp_recompensa: licao.xp_recompensa,
                    completada,
                    pontuacao: progresso?.pontuacao || 0,
                    xp_ganho: progresso?.xp_ganho || 0,
                    tentativas: progresso?.tentativas || 0,
                };
            });

            return {
                id: modulo.id,
                titulo: modulo.titulo,
                descricao: modulo.descricao,
                icone: modulo.icone,
                ordem: modulo.ordem,
                xp_recompensa: modulo.xp_recompensa,
                completado: moduloCompletado,
                licoes: licoesComStatus,
            };
        });

        return {
            turma_id: turmaId,
            aluno_id: alunoId,
            estatisticas: {
                total_licoes: totalLicoes,
                licoes_completadas: licoesCompletadas,
                percentual: totalLicoes > 0 ? Math.round((licoesCompletadas / totalLicoes) * 100) : 0,
                xp_total: xpTotal,
            },
            modulos: modulosComStatus,
        };
    } catch (error) {
        logger.error('Erro ao obter progresso do aluno:', error);
        throw error;
    }
}

/**
 * Registrar progresso em uma lição
 */
export async function registrarProgresso(
    turmaId: string,
    licaoId: string,
    alunoId: string,
    dados: RegistrarProgressoInput
) {
    try {
        // Buscar matrícula do aluno
        const matricula = await prisma.turma_aluno.findUnique({
            where: {
                turma_id_aluno_id: {
                    turma_id: turmaId,
                    aluno_id: alunoId,
                },
            },
        });

        if (!matricula || !matricula.ativo) {
            return { success: false, message: 'Você não está matriculado nesta turma' };
        }

        // Verificar se a lição pertence à turma
        const licao = await prisma.trilha_licao.findFirst({
            where: {
                id: licaoId,
                modulo: {
                    turma_id: turmaId,
                    ativo: true,
                },
            },
        });

        if (!licao) {
            return { success: false, message: 'Lição não encontrada' };
        }

        // Calcular XP baseado na pontuação
        const xpGanho = dados.completado
            ? Math.round((dados.pontuacao / 100) * licao.xp_recompensa)
            : 0;

        // Buscar ou criar progresso
        const progressoExistente = await prisma.progresso_aluno.findUnique({
            where: {
                turma_aluno_id_licao_id: {
                    turma_aluno_id: matricula.id,
                    licao_id: licaoId,
                },
            },
        });

        let progresso;
        if (progressoExistente) {
            progresso = await prisma.progresso_aluno.update({
                where: { id: progressoExistente.id },
                data: {
                    completado: dados.completado,
                    pontuacao: dados.pontuacao,
                    xp_ganho: xpGanho,
                    tentativas: progressoExistente.tentativas + 1,
                    completado_em: dados.completado ? new Date() : null,
                },
            });
        } else {
            progresso = await prisma.progresso_aluno.create({
                data: {
                    id: uuidv4(),
                    turma_aluno_id: matricula.id,
                    licao_id: licaoId,
                    completado: dados.completado,
                    pontuacao: dados.pontuacao,
                    xp_ganho: xpGanho,
                    tentativas: 1,
                    completado_em: dados.completado ? new Date() : null,
                },
            });
        }

        logger.info(`Progresso registrado: aluno ${alunoId}, lição ${licaoId}`);
        return {
            success: true,
            message: dados.completado ? 'Lição completada!' : 'Progresso salvo',
            progresso,
            xp_ganho: xpGanho,
        };
    } catch (error) {
        logger.error('Erro ao registrar progresso:', error);
        throw error;
    }
}
