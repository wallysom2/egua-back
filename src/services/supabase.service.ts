import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase para validação de tokens no backend
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
