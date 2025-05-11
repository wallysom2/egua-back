import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { prisma } from '../utils/database.js';
import { CadastroInput, LoginInput, TipoUsuario } from '../schema/usuario.schema.js';
import { logger } from '../utils/logger.js';

// Segredo JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Rounds de salt para bcrypt
const SALT_ROUNDS = 10;

/**
 * Cadastrar um novo usuário
 */
export const cadastrarUsuario = async (dadosUsuario: Omit<CadastroInput, 'confirmarSenha'>) => {
  try {
    const { email, senha, nome, tipo, cpf } = dadosUsuario;

    // Verificar se usuário já existe por CPF (campo único no schema)
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { cpf }
    });

    if (usuarioExistente) {
      return {
        success: false,
        message: 'Usuário com este CPF já existe'
      };
    }

    // Verificar se email já está em uso (busca não única)
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
        email,
        senha_hash: senhaHash,
        nome,
        tipo: tipo,
        cpf,
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