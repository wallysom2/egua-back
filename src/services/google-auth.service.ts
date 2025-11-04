import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/database.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface GoogleTokenPayload {
  email: string;
  name: string;
  picture?: string;
  sub: string; // Google user ID
}

/**
 * Verificar e validar o token do Google
 */
export const verificarTokenGoogle = async (token: string): Promise<GoogleTokenPayload | null> => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      logger.error('GOOGLE_CLIENT_ID não configurado nas variáveis de ambiente');
      return null;
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return null;
    }

    if (!payload.email || !payload.name || !payload.sub) {
      logger.error('Payload do Google incompleto');
      return null;
    }

    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      sub: payload.sub,
    };
  } catch (error) {
    logger.error('Erro ao verificar token do Google:', error);
    return null;
  }
};

/**
 * Login ou cadastro de usuário via Google OAuth
 */
export const loginOuCadastrarGoogle = async (googleData: GoogleTokenPayload) => {
  try {
    const { email, name, sub } = googleData;

    // Verificar se usuário já existe pelo Google ID ou email
    let usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { google_id: sub },
          { email }
        ]
      }
    });

    // Se não existe, criar novo usuário
    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          id: uuidv4(),
          email,
          nome: name,
          google_id: sub,
          senha_hash: null, // Usuários OAuth não precisam de senha
          tipo: 'aluno', // Tipo padrão para novos usuários OAuth
          ativo: true
        }
      });

      logger.info(`Novo usuário criado via Google OAuth: ${email}`);
    } else {
      // Se usuário existe mas não tem google_id, atualizar para vincular
      if (!usuario.google_id) {
        usuario = await prisma.usuario.update({
          where: { id: usuario.id },
          data: { google_id: sub }
        });
      }
      logger.info(`Usuário existente logado via Google OAuth: ${email}`);
    }

    // Gerar token JWT
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
    logger.error('Erro no serviço loginOuCadastrarGoogle:', error);
    throw error;
  }
};

