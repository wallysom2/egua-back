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
        <div style="background:#f7f8fb; padding:32px 16px; font-family: Arial, Helvetica, sans-serif;">
          <div style="max-width:680px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px rgba(17,24,39,0.08);">
            <div style="padding:32px 28px 0 28px; text-align:center;">
              <div style="font-size:34px; line-height:1.2; font-weight:800; color:#4f46e5; margin:0 0 8px;">Senior Code AI</div>
              <div style="color:#6b7280; font-size:15px; max-width:520px; margin:0 auto 20px;">
                Uma jornada simplificada para aprender com ajuda de IA. Use o código abaixo para continuar a recuperação da sua conta.
              </div>
            </div>

            <div style="padding:0 28px 28px 28px;">
              <div style="text-align:center; margin:22px auto; padding:22px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:14px; max-width:420px;">
                <div style="color:#7c3aed; font-size:40px; letter-spacing:8px; font-family:'Courier New', monospace; font-weight:800;">${token}</div>
                <div style="color:#6b7280; font-size:12px; margin-top:8px;">Código de verificação (expira em 1 hora)</div>
              </div>

              <div style="text-align:center; margin:28px 0 12px;">
                <a href="${resetUrl}" style="background:linear-gradient(90deg, #7c3aed 0%, #4f46e5 100%); color:#ffffff; padding:12px 22px; text-decoration:none; border-radius:999px; font-weight:700; display:inline-block; box-shadow:0 6px 18px rgba(79,70,229,0.35);">
                  Abrir página de recuperação →
                </a>
              </div>

              <p style="color:#6b7280; font-size:12px; text-align:center; margin:16px 0 0;">
                Se você não solicitou esta recuperação, ignore este email com segurança.
              </p>
            </div>

            <div style="border-top:1px solid #f3f4f6; padding:14px 24px; color:#9ca3af; font-size:12px; text-align:center;">
              Equipe Senior Code
            </div>
          </div>
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
