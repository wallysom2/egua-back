import { Request, Response } from 'express';
import { cadastrarUsuario, loginUsuario, solicitarRecuperacaoSenha, redefinirSenha as redefinirSenhaService, validarTokenRecuperacao } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';
import { CadastroInput, LoginInput } from '../schema/usuario.schema.js';

export const cadastro = async (req: Request, res: Response): Promise<void> => {
  try {
    const { confirmarSenha, ...dadosUsuario } = req.body as CadastroInput;
    
    const resultado = await cadastrarUsuario(dadosUsuario);
    
    if (!resultado.success) {
      res.status(400).json(resultado);
      return;
    }    
    res.status(201).json(resultado);
  } catch (error) {
    logger.error('Erro no controlador de cadastro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao cadastrar usuário'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const dadosLogin = req.body as LoginInput;
    const resultado = await loginUsuario(dadosLogin);
    if (!resultado.success) {
      res.status(401).json(resultado);
      return;
    }
    res.status(200).json(resultado);
  } catch (error) {
    logger.error('Erro no controlador de login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer login'
    });
  }
};

/**
 * Solicitar recuperação de senha
 */
export const solicitarRecuperacao = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
      return;
    }

    const resultado = await solicitarRecuperacaoSenha(email);
    
    if (!resultado.success) {
      res.status(400).json(resultado);
      return;
    }
    
    res.status(200).json(resultado);
  } catch (error) {
    logger.error('Erro no controlador solicitarRecuperacao:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao solicitar recuperação de senha'
    });
  }
};

/**
 * Redefinir senha
 */
export const redefinirSenha = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, novaSenha } = req.body;
    
    if (!token || !novaSenha) {
      res.status(400).json({
        success: false,
        message: 'Token e nova senha são obrigatórios'
      });
      return;
    }

    if (novaSenha.length < 6) {
      res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
      return;
    }

    const resultado = await redefinirSenhaService(token, novaSenha);
    
    if (!resultado.success) {
      res.status(400).json(resultado);
      return;
    }
    
    res.status(200).json(resultado);
  } catch (error) {
    logger.error('Erro no controlador redefinirSenha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao redefinir senha'
    });
  }
};

/**
 * Validar token de recuperação
 */
export const validarToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    
    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token é obrigatório'
      });
      return;
    }

    const resultado = await validarTokenRecuperacao(token);
    
    if (!resultado.success) {
      res.status(400).json(resultado);
      return;
    }
    
    res.status(200).json(resultado);
  } catch (error) {
    logger.error('Erro no controlador validarToken:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao validar token'
    });
  }
}; 