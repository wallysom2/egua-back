import { Resend } from 'resend';
import { logger } from '../utils/logger.js';

const resend = new Resend(process.env.RESEND_API_KEY || 're_fake_key_for_development');

/**
 * Enviar email de recuperação de senha
 */
export const enviarEmailRecuperacaoSenha = async (email: string, nome: string, token: string) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/recuperar-senha/inserir-codigo?email=${encodeURIComponent(email)}`;
    
    logger.info(`Tentando enviar email para ${email} com token ${token.substring(0, 10)}...`);
    
    const { data, error } = await resend.emails.send({
      from: `Senior Code <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to: [email],
      subject: 'Recuperação de Senha - Senior Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Olá, ${nome}!</h2>
          <p>Você solicitou a recuperação de senha para sua conta no Senior Code.</p>
          <p>Use o código abaixo para redefinir sua senha:</p>
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
            Acesse o link abaixo e insira este código na página de recuperação:
          </p>
          <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
            <h1 style="color: #007bff; font-size: 36px; margin: 0; letter-spacing: 5px; font-family: 'Courier New', monospace;">${token}</h1>
            <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">Código de recuperação</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Inserir Código
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Este código expira em 1 hora. Se você não solicitou esta recuperação, ignore este email.
          </p>
          <p style="color: #666; font-size: 12px;">
            Se o botão não funcionar, copie e cole este link no seu navegador:<br>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
        </div>
      `,
    });

    if (error) {
      logger.error('Erro ao enviar email de recuperação:', error);
      
      // Em desenvolvimento ou erro de domínio, apenas logar mas não falhar
      if (process.env.NODE_ENV === 'development' || (error as any).statusCode === 403) {
        logger.warn('Modo desenvolvimento: Email não enviado devido a restrições do Resend, mas processo continuou');
        logger.info(`Código de recuperação gerado: ${token}`);
        logger.info(`URL de recuperação: ${resetUrl}`);
        return { success: true, messageId: 'dev-mode' };
      }
      
      throw new Error('Falha ao enviar email de recuperação');
    }

    logger.info(`Email de recuperação enviado para ${email}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    logger.error('Erro no serviço de email:', error);
    throw error;
  }
};

/**
 * Enviar email de confirmação de senha alterada
 */
export const enviarEmailSenhaAlterada = async (email: string, nome: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `Senior Code <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to: [email],
      subject: 'Senha Alterada com Sucesso - Senior Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Olá, ${nome}!</h2>
          <p>Sua senha foi alterada com sucesso.</p>
          <p>Se você não fez esta alteração, entre em contato conosco imediatamente.</p>
          <p style="color: #666; font-size: 14px;">
            Equipe Senior Code
          </p>
        </div>
      `,
    });

    if (error) {
      logger.error('Erro ao enviar email de confirmação:', error);
      
      // Em desenvolvimento ou erro de domínio, apenas logar mas não falhar
      if (process.env.NODE_ENV === 'development' || (error as any).statusCode === 403) {
        logger.warn('Modo desenvolvimento: Email de confirmação não enviado devido a restrições do Resend, mas processo continuou');
        return { success: true, messageId: 'dev-mode' };
      }
      
      throw new Error('Falha ao enviar email de confirmação');
    }

    logger.info(`Email de confirmação enviado para ${email}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    logger.error('Erro no serviço de email:', error);
    throw error;
  }
};
