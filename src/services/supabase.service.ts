import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Cliente Supabase para validação de tokens e gerenciamento de usuários no backend
 */
class SupabaseAdmin {
    private client: SupabaseClient;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configuradas');
        }

        this.client = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }

    /**
     * Valida um token JWT do Supabase e retorna o usuário
     */
    async validateToken(token: string) {
        try {
            // Validação básica da estrutura do token
            if (!token || token.trim() === '') {
                console.error('Token vazio fornecido');
                return null;
            }

            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                console.error(`Token malformado: esperado 3 partes, recebido ${tokenParts.length}`);
                return null;
            }

            const { data: { user }, error } = await this.client.auth.getUser(token);

            if (error) {
                console.error('Erro ao validar token:', error.message);
                return null;
            }

            return user;
        } catch (error) {
            console.error('Erro ao validar token Supabase:', error);
            return null;
        }
    }

    /**
     * Lista todos os usuários (Admin API)
     */
    async listAllUsers() {
        return await this.client.auth.admin.listUsers();
    }

    /**
     * Obtém um usuário por ID (Admin API)
     */
    async getUserById(id: string) {
        return await this.client.auth.admin.getUserById(id);
    }

    /**
     * Atualiza os metadados do usuário (Admin API)
     */
    async updateUserMetadata(id: string, metadata: Record<string, unknown>) {
        return await this.client.auth.admin.updateUserById(id, {
            user_metadata: metadata,
        });
    }

    /**
     * Exclui um usuário (Admin API)
     */
    async deleteUser(id: string) {
        return await this.client.auth.admin.deleteUser(id);
    }

    /**
     * Retorna o cliente Supabase para outras operações
     */
    getClient() {
        return this.client;
    }
}

// Singleton
let supabaseAdmin: SupabaseAdmin | null = null;

export function getSupabaseAdmin(): SupabaseAdmin {
    if (!supabaseAdmin) {
        supabaseAdmin = new SupabaseAdmin();
    }
    return supabaseAdmin;
}
