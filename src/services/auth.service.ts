import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

import { prisma } from '../utils/database.js';
import { CadastroInput, LoginInput, TipoUsuario } from '../schema/usuario.schema.js';
import { logger } from '../utils/logger.js';
import { enviarEmailRecuperacaoSenha, enviarEmailSenhaAlterada } from './email.service.js';

// Segredo JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Rounds de salt para bcrypt
const SALT_ROUNDS = 10;

/**
 * Cadastrar um novo usuário
 */
export const cadastrarUsuario = async (dadosUsuario: Omit<CadastroInput, 'confirmarSenha'>) => {
  try {
    const { email, senha, nome, tipo } = dadosUsuario;

    // Verificar se email já está em uso
    const emailExistente = await prisma.usuario.findFirst({
      where: { email }
    });

    if (emailExistente) {
      return {
        success: false,
        message: 'Email já está em uso'
      };
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    // Criar novo usuário
    const novoUsuario = await prisma.usuario.create({
      data: {
        id: uuidv4(),
        email,
        senha_hash: senhaHash,
        nome,
        tipo: tipo,
        ativo: true
      }
    });

    // Gerar token JWT
    const token = jwt.sign(
      { 
        usuarioId: novoUsuario.id,
        email: novoUsuario.email,
        tipo: novoUsuario.tipo
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        usuario: {
          id: novoUsuario.id,
          email: novoUsuario.email,
          nome: novoUsuario.nome,
          tipo: novoUsuario.tipo
        },
        token
      }
    };
  } catch (error) {
    logger.error('Erro no serviço cadastrarUsuario:', error);
    throw error;
  }
};

/**
 * Login de usuário
 */
export const loginUsuario = async (dadosLogin: LoginInput) => {
  try {
    const { email, senha } = dadosLogin;

    // Encontrar o usuário pelo email (busca não única)
    const usuario = await prisma.usuario.findFirst({
      where: { email }
    });

    // Se usuário não existe
    if (!usuario) {
      return {
        success: false,
        message: 'Email ou senha incorretos'
      };
    }

    // Comparar senhas
    const isSenhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!isSenhaValida) {
      return {
        success: false,
        message: 'Email ou senha incorretos'
      };
    }

    const token = jwt.sign(
      { 
        usuarioId: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nome: usuario.nome,
          tipo: usuario.tipo
        },
        token
      }
    };
  } catch (error) {
    logger.error('Erro no serviço loginUsuario:', error);
    throw error;
  }
};

/**
 * Solicitar recuperação de senha
 */
export const solicitarRecuperacaoSenha = async (email: string) => {
  try {
    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findFirst({
      where: { email, ativo: true }
    });

    if (!usuario) {
      return {
        success: false,
        message: 'Email não encontrado ou usuário inativo'
      };
    }

    // Gerar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Salvar token no banco
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        reset_password_token: resetToken,
        reset_password_token_expires: tokenExpires,
        reset_password_requested_at: new Date()
      }
    });

    // Enviar email
    await enviarEmailRecuperacaoSenha(usuario.email, usuario.nome, resetToken);

    return {
      success: true,
      message: 'Email de recuperação enviado com sucesso'
    };
  } catch (error) {
    logger.error('Erro no serviço solicitarRecuperacaoSenha:', error);
    throw error;
  }
};

/**
 * Redefinir senha com token
 */
export const redefinirSenha = async (token: string, novaSenha: string) => {
  try {
    // Buscar usuário pelo token
    const usuario = await prisma.usuario.findFirst({
      where: {
        reset_password_token: token,
        reset_password_token_expires: {
          gt: new Date() // Token ainda não expirou
        }
      }
    });

    if (!usuario) {
      return {
        success: false,
        message: 'Token inválido ou expirado'
      };
    }

    // Hash da nova senha
    const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);

    // Atualizar senha e limpar token
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha_hash: senhaHash,
        reset_password_token: null,
        reset_password_token_expires: null,
        reset_password_requested_at: null,
        updated_at: new Date()
      }
    });

    // Enviar email de confirmação
    await enviarEmailSenhaAlterada(usuario.email, usuario.nome);

    return {
      success: true,
      message: 'Senha redefinida com sucesso'
    };
  } catch (error) {
    logger.error('Erro no serviço redefinirSenha:', error);
    throw error;
  }
};

/**
 * Validar token de recuperação
 */
export const validarTokenRecuperacao = async (token: string) => {
  try {
    const usuario = await prisma.usuario.findFirst({
      where: {
        reset_password_token: token,
        reset_password_token_expires: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        email: true,
        nome: true
      }
    });

    if (!usuario) {
      return {
        success: false,
        message: 'Token inválido ou expirado'
      };
    }

    return {
      success: true,
      message: 'Token válido',
      data: {
        email: usuario.email,
        nome: usuario.nome
      }
    };
  } catch (error) {
    logger.error('Erro no serviço validarTokenRecuperacao:', error);
    throw error;
  }
}; 