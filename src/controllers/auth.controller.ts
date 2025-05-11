import { Request, Response } from 'express';
import { cadastrarUsuario, loginUsuario } from '../services/auth.service.js';
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