# Especificação Técnica — Módulo de Autenticação
## Projeto: Controle Financeiro Casal
**Para:** Agente de implementação (Cursor)
**Escopo desta spec:** Logout, Toggle de visibilidade de senha, Recuperação de senha, Cadastro (Sign Up)

---

## 1. Contexto do projeto (obrigatório ler antes de implementar)

- Stack: React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + React Router DOM 7
- Backend: Supabase (Auth + PostgreSQL + Realtime), client em `src/lib/supabase.ts`
- Autenticação atual: `src/contexts/AuthContext.tsx` expõe `{ session, user, loading, signOut }`
- Tela de login existente: `src/pages/Login.tsx`, usa `supabase.auth.signInWithPassword`
- Notificações: biblioteca `sonner` (`toast.success`, `toast.error`)
- Ícones: `lucide-react`
- Roteamento definido em `src/App.tsx`
- Layout protegido: `src/components/Layout.tsx`, usa `useAuth()` e redireciona para `/login` se não houver `user`
- Idioma da UI: português brasileiro
- Padrão visual: cards `rounded-2xl`, cor primária indigo (`#4f46e5`, classes `indigo-600`/`indigo-700`), mobile-first, `max-w-md`

Não alterar estrutura de pastas existente. Novas páginas vão em `src/pages/`.

---

## 2. Feature 1 — Logout

### 2.1 Requisito funcional
Adicionar botão de logout acessível a partir de qualquer rota protegida (dentro de `Layout.tsx`).

### 2.2 Especificação técnica
- Local: header do componente `Layout.tsx`
- Ação: chamar `signOut()` do `AuthContext`
- Ícone: `LogOut` (lucide-react)
- Feedback: `toast.success('Sessão encerrada')` em caso de sucesso; `toast.error('Erro ao sair')` em caso de falha (try/catch)
- Pós-logout: redirecionamento para `/login` já ocorre automaticamente via `AuthContext` + proteção de rota existente. Não é necessário `navigate()` manual.

### 2.3 Critérios de aceite
- [ ] Botão visível em todas as páginas dentro do `Layout`
- [ ] Ao clicar, sessão é encerrada e usuário é redirecionado para `/login`
- [ ] Erro de rede/API exibe toast de erro e não trava a UI

---

## 3. Feature 2 — Toggle de visibilidade de senha

### 3.1 Requisito funcional
No campo de senha da tela `Login.tsx`, permitir alternar entre exibir e ocultar o texto digitado.

### 3.2 Especificação técnica
- Estado local: `const [showPassword, setShowPassword] = useState(false)`
- Input de senha: `type={showPassword ? 'text' : 'password'}`
- Botão de toggle posicionado dentro do input (posição absoluta, lado direito), ícones `Eye` / `EyeOff` (lucide-react)
- Botão deve ter `type="button"` (evitar submit acidental do form)
- Botão deve ter `tabIndex={-1}` (não interferir na navegação por Tab)

### 3.3 Critérios de aceite
- [ ] Clique no ícone alterna entre mostrar/ocultar sem submeter o formulário
- [ ] Comportamento não interfere na navegação por teclado (Tab)
- [ ] Aplicar mesmo padrão em qualquer outro campo de senha criado (cadastro, redefinição)

---

## 4. Feature 3 — Recuperação de senha ("Esqueci minha senha")

### 4.1 Requisito funcional
Fluxo de 2 etapas:
1. Usuário informa email e recebe link de recuperação
2. Usuário acessa link e define nova senha

### 4.2 Especificação técnica — Etapa 1

**Nova rota:** `/esqueci-senha`
**Novo arquivo:** `src/pages/EsqueciSenha.tsx`

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) {
      toast.error('Erro ao enviar email');
    } else {
      setEnviado(true);
    }
  };

  if (enviado) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p>Se o email existir, enviamos um link de recuperação.</p>
        <Link to="/login" className="text-indigo-600">Voltar ao login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Esqueci minha senha</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu email"
        required
        className="w-full border rounded-xl p-3"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white rounded-xl p-3 font-semibold"
      >
        {loading ? 'Enviando...' : 'Enviar link'}
      </button>
      <Link to="/login" className="block text-center text-gray-500">Voltar</Link>
    </form>
  );
}
```

### 4.3 Especificação técnica — Etapa 2

**Nova rota:** `/redefinir-senha`
**Novo arquivo:** `src/pages/RedefinirSenha.tsx`

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function RedefinirSenha() {
  const [novaSenha, setNovaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setLoading(false);
    if (error) {
      toast.error('Erro ao redefinir senha');
    } else {
      toast.success('Senha alterada com sucesso');
      navigate('/login');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Nova senha</h1>
      <input
        type="password"
        value={novaSenha}
        onChange={(e) => setNovaSenha(e.target.value)}
        placeholder="Nova senha"
        minLength={6}
        required
        className="w-full border rounded-xl p-3"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white rounded-xl p-3 font-semibold"
      >
        Salvar nova senha
      </button>
    </form>
  );
}
```

Aplicar o toggle de visibilidade de senha (Feature 2) neste campo também.

### 4.4 Rotas a adicionar em `App.tsx`
```tsx
<Route path="/esqueci-senha" element={<EsqueciSenha />} />
<Route path="/redefinir-senha" element={<RedefinirSenha />} />
```

### 4.5 Link na tela de login
Adicionar link `"Esqueci minha senha"` em `Login.tsx`, abaixo do formulário, apontando para `/esqueci-senha`.

### 4.6 Configuração externa necessária (não é código)
No Supabase Dashboard → Authentication → URL Configuration → Redirect URLs, adicionar:
```
https://[dominio-vercel]/redefinir-senha
```

### 4.7 Critérios de aceite
- [ ] Submissão de email válido dispara envio de link (via Supabase Auth)
- [ ] Mensagem de confirmação não revela se o email existe ou não na base (segurança)
- [ ] Link recebido redireciona para `/redefinir-senha` com sessão de recuperação ativa
- [ ] Nova senha com menos de 6 caracteres é rejeitada pelo `minLength` e pela validação do Supabase
- [ ] Após sucesso, redireciona para `/login`

---

## 5. Feature 4 — Cadastro (Sign Up)

### 5.1 Requisito funcional
Nova tela de cadastro com email e senha, usando `supabase.auth.signUp`.

### 5.2 Especificação técnica

**Nova rota:** `/cadastro`
**Novo arquivo:** `src/pages/Cadastro.tsx`

```tsx
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Cadastro() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password: senha });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Verifique seu email para confirmar o cadastro');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Criar conta</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        className="w-full border rounded-xl p-3"
      />
      <input
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="Senha"
        minLength={6}
        required
        className="w-full border rounded-xl p-3"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white rounded-xl p-3 font-semibold"
      >
        {loading ? 'Criando...' : 'Criar conta'}
      </button>
      <Link to="/login" className="block text-center text-gray-500">Já tenho conta</Link>
    </form>
  );
}
```

Aplicar o toggle de visibilidade de senha (Feature 2) no campo de senha desta tela.

### 5.3 Rota a adicionar em `App.tsx`
```tsx
<Route path="/cadastro" element={<Cadastro />} />
```

### 5.4 Link na tela de login
Adicionar link `"Criar conta"` em `Login.tsx`.

### 5.5 Pré-requisito de segurança (bloqueante)
Esta feature **não deve ser implementada em produção** antes de RLS (Row Level Security) estar habilitado e testado nas tabelas `lancamentos`, `categorias` e `cartoes`. Sem RLS, qualquer conta criada via signup público tem acesso de leitura/escrita irrestrito aos dados existentes.

Se o agente for instruído a implementar esta feature, deve implementar o código mas sinalizar este pré-requisito como pendência separada, não bloqueante para o código em si, mas bloqueante para deploy em produção.

### 5.6 Configuração externa relacionada (não é código)
- Supabase Dashboard → Authentication → Providers → Email → controlar se "Enable email signups" está habilitado ou não, conforme decisão de produto.

### 5.7 Critérios de aceite
- [ ] Cadastro com email/senha válidos cria usuário no Supabase Auth
- [ ] Erros do Supabase (email duplicado, senha fraca) exibem mensagem via toast
- [ ] Usuário já autenticado que acessar `/cadastro` é redirecionado para `/`
- [ ] Campo de senha usa toggle de visibilidade (Feature 2)

---

## 6. Resumo de arquivos afetados

| Arquivo | Ação |
|---|---|
| `src/components/Layout.tsx` | Editar — adicionar botão de logout |
| `src/pages/Login.tsx` | Editar — toggle de senha, links para cadastro e recuperação |
| `src/pages/EsqueciSenha.tsx` | Criar |
| `src/pages/RedefinirSenha.tsx` | Criar |
| `src/pages/Cadastro.tsx` | Criar |
| `src/App.tsx` | Editar — adicionar 3 novas rotas |

## 7. Dependências
Nenhuma dependência nova. Todas as bibliotecas (`lucide-react`, `sonner`, `@supabase/supabase-js`, `react-router-dom`) já estão instaladas no projeto conforme documento técnico base.

## 8. Fora de escopo desta spec
- RLS policies (tratado em spec separada)
- Edição/exclusão de lançamentos
- Confirmação de email customizada (usa fluxo padrão do Supabase)
- Rate limiting de tentativas de login/cadastro