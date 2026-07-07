# Controle Financeiro Casal

App privado para controle de gastos do casal em tempo real.

## Rodar localmente

**Pré-requisitos:** Node.js

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie `.env.example` para `.env` e preencha com as credenciais do Supabase:
   ```bash
   cp .env.example .env
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse `http://localhost:3000`

## Deploy na web (GitHub + Vercel)

### 1. Supabase

No [Supabase Dashboard](https://supabase.com/dashboard):

- Crie o projeto com as tabelas `categorias`, `cartoes` e `lancamentos`
- Ative **Realtime** na tabela `lancamentos`
- Crie os usuários em **Authentication → Users** (você e sua esposa)
- Anote a **URL** e a **anon key** em **Settings → API**

### 2. GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/financas-casal.git
git push -u origin main
```

> O arquivo `.env` **não** vai para o GitHub (está no `.gitignore`). As chaves ficam só na Vercel.

### 3. Vercel

1. Acesse [vercel.com](https://vercel.com) e entre com o GitHub
2. **Add New → Project** → importe o repositório
3. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clique em **Deploy**

A Vercel detecta o Vite automaticamente (`npm run build` → pasta `dist`).

### 4. Auth no Supabase (após o deploy)

No Supabase → **Authentication → URL Configuration**:

| Campo | Valor |
|-------|-------|
| **Site URL** | `https://seu-app.vercel.app` |
| **Redirect URLs** | `https://seu-app.vercel.app/**` |

### Fluxo de desenvolvimento

```
Desenvolve local (npm run dev) → commit → push → Vercel publica automaticamente
```

- Branch `main` = versão que vocês usam no dia a dia
- Outras branches geram URLs de preview na Vercel para testar antes de publicar

### Instalar no celular (PWA)

Abra a URL da Vercel no navegador e use **Adicionar à tela inicial**.
