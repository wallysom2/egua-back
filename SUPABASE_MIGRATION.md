# 🚀 Migração para Supabase Auth

## Resumo das Mudanças

### Frontend (egua-front)

#### Novos Arquivos
- `src/lib/supabase/client.ts` - Cliente Supabase para browser
- `src/lib/supabase/server.ts` - Cliente Supabase para Server Components
- `src/middleware.ts` - Middleware para refresh automático de sessões e proteção de rotas
- `src/app/auth/callback/route.ts` - Handler para callback do OAuth

#### Arquivos Modificados
- `src/contexts/AuthContext.tsx` - Refatorado para usar Supabase Auth
- `src/components/Providers.tsx` - Removido GoogleOAuthProvider
- `src/app/login/page.tsx` - Usa Supabase Auth diretamente
- `src/app/cadastro/page.tsx` - Usa Supabase Auth diretamente
- `src/app/dashboard/page.tsx` - Atualizado para usar `signOut`
- `src/app/aluno/page.tsx` - Atualizado para usar `signOut`
- `.env.example` - Adicionadas variáveis do Supabase

#### Dependências
- Adicionadas: `@supabase/supabase-js`, `@supabase/ssr`
- Removidas: `@react-oauth/google`

### Backend (egua-back)

#### Novos Arquivos
- `src/services/supabase.service.ts` - Serviço para validar tokens Supabase

#### Arquivos Modificados
- `src/middlewares/auth.middleware.ts` - Valida tokens JWT do Supabase
- `src/routes/auth.routes.ts` - Simplificado (Supabase gerencia auth)
- `src/controllers/userExercicio.controller.ts` - Usa `req.usuario.id`
- `src/controllers/userResposta.controller.ts` - Usa `req.usuario.id`
- `src/services/userExercicio.service.ts` - Simplificado verificarUsuarioExiste
- `prisma/schema.prisma` - Removido modelo usuario, usuario_id agora é UUID
- `.env.example` - Adicionadas variáveis do Supabase

#### Dependências
- Adicionadas: `@supabase/supabase-js`

---

## 📋 Setup do Supabase

### 1. Criar Projeto no Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em "New Project"
3. Escolha um nome e senha para o banco de dados
4. Selecione a região mais próxima (ex: South America - São Paulo)
5. Aguarde a criação do projeto

### 2. Obter Credenciais

1. No dashboard do projeto, vá em **Settings > API**
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Apenas backend!)

### 3. Configurar Variáveis de Ambiente

#### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...sua-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8080
```

#### Backend (.env)
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...sua-service-role-key
DATABASE_URL=postgresql://postgres:suaSenha@db.seu-projeto.supabase.co:5432/postgres
```

### 4. Configurar Google OAuth (Opcional)

1. No dashboard do Supabase, vá em **Authentication > Providers > Google**
2. Habilite o provider
3. Configure com suas credenciais do Google Cloud Console:
   - Client ID
   - Client Secret
4. Adicione os Redirect URLs nas configurações do Google Cloud Console:
   - `https://seu-projeto.supabase.co/auth/v1/callback`

### 5. Configurar Redirect URLs

1. Vá em **Authentication > URL Configuration**
2. Adicione os URLs de redirecionamento permitidos:
   - `http://localhost:3000/**` (desenvolvimento)
   - `https://seu-dominio.com/**` (produção)

### 6. Migrar o Banco de Dados

Como você está migrando para o Supabase PostgreSQL, você tem duas opções:

#### Opção A: Criar do Zero (Recomendado para MVP)
```bash
cd egua-back
npx prisma db push
```

#### Opção B: Migração Completa
```bash
cd egua-back
npx prisma migrate dev --name supabase_migration
```

---

## 🔧 Executar em Desenvolvimento

### Backend
```bash
cd egua-back
npm run dev
```

### Frontend
```bash
cd egua-front
npm run dev
```

---

## 🎯 Benefícios da Migração

1. ✅ **Sem Cold Start no Login** - Supabase Auth é sempre ativo
2. ✅ **OAuth Gerenciado** - Google, GitHub, etc. configurados no dashboard
3. ✅ **Refresh Tokens Automático** - Sessões renovadas automaticamente
4. ✅ **Segurança Melhorada** - Tokens validados pelo Supabase
5. ✅ **Menos Código para Manter** - Auth service simplificado

---

## 📝 Próximos Passos (Opcional)

- [ ] Configurar Row Level Security (RLS) no Supabase
- [ ] Implementar recuperação de senha via Supabase
- [ ] Adicionar MFA/2FA
- [ ] Configurar domínio customizado no Supabase
