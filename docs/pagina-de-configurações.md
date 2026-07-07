# Especificação Técnica — Página de Configurações
## Projeto: Controle Financeiro Casal
**Para:** Agente de implementação (Cursor)
**Escopo desta spec:** Nova rota `/configuracoes` com seções Perfil, Preferências (tema) e Logout

**Substitui:** a Feature 1 (Logout no header do Layout) da spec anterior `spec-auth-features.md`. O botão de logout deixa de ficar no `Layout.tsx` e passa a viver exclusivamente nesta nova página.

---

## 1. Contexto do projeto (obrigatório ler antes de implementar)

- Stack: React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + React Router DOM 7
- Backend: Supabase (Auth + PostgreSQL + Realtime), client em `src/lib/supabase.ts`
- `AuthContext` (`src/contexts/AuthContext.tsx`) expõe `{ session, user, loading, signOut }`
- `user` do Supabase Auth contém `email`, `id`, e `user_metadata` (objeto livre, key-value)
- Notificações: `sonner` (`toast.success`, `toast.error`)
- Ícones: `lucide-react`
- Nav inferior atual (`Layout.tsx`): 3 abas — Extrato | Novo | Dashboard
- Padrão visual: cards `rounded-2xl`, `shadow-sm`, `border-gray-100`, cor primária indigo (`#4f46e5`), mobile-first, `max-w-md`

---

## 2. Requisito funcional geral

Nova página `/configuracoes`, rota protegida, acessível a partir de um novo item na navegação. Contém 3 seções: **Perfil**, **Preferências**, **Sair (logout)**.

---

## 3. Navegação

### 3.1 Alteração no `Layout.tsx`
Adicionar 4ª aba na nav inferior: **Configurações** (ícone `Settings` do lucide-react).

Nav inferior passa a ser: Extrato | Novo | Dashboard | Configurações

### 3.2 Remoção
Remover o botão de logout do header do `Layout.tsx` (implementado na spec anterior, seção 2). O `signOut` deixa de ser chamado a partir do Layout.

---

## 4. Nova rota

**Arquivo:** `src/pages/Configuracoes.tsx`
**Rota em `App.tsx`:**
```tsx
<Route path="/configuracoes" element={<Configuracoes />} />
```
Deve ser rota protegida (dentro do mesmo grupo de rotas que usa `Layout` + verificação de `user`).

---

## 5. Seção Perfil

### 5.1 Campos exibidos
- **Avatar**: imagem circular. Fonte: `user.user_metadata.avatar_url` se existir; caso contrário, exibir iniciais do nome ou email em um círculo com cor de fundo indigo (fallback).
- **Nome**: `user.user_metadata.nome` se existir; caso não exista o campo, exibir o email como fallback.
- **Email**: `user.email`, sempre somente leitura (não editável nesta versão).

### 5.2 Edição
Nesta versão, **nome é editável, email não é**. Avatar: apenas exibição nesta versão (upload de avatar fica fora de escopo — ver seção 9).

Ao editar o nome, salvar via:
```tsx
const { error } = await supabase.auth.updateUser({
  data: { nome: novoNome }
});
```

### 5.3 Componente de referência
```tsx
function SecaoPerfil() {
  const { user } = useAuth();
  const [nome, setNome] = useState(user?.user_metadata?.nome || '');
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url;
  const iniciais = (nome || user?.email || '?').charAt(0).toUpperCase();

  const handleSalvar = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ data: { nome } });
    setLoading(false);
    if (error) {
      toast.error('Erro ao salvar nome');
    } else {
      toast.success('Nome atualizado');
      setEditando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
      <h2 className="font-semibold text-gray-700">Perfil</h2>
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-semibold">
            {iniciais}
          </div>
        )}
        <div className="flex-1">
          {editando ? (
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="Seu nome"
            />
          ) : (
            <p className="font-medium">{nome || user?.email}</p>
          )}
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>
      {editando ? (
        <div className="flex gap-2">
          <button onClick={handleSalvar} disabled={loading} className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-semibold">
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={() => setEditando(false)} className="text-gray-500 text-sm">Cancelar</button>
        </div>
      ) : (
        <button onClick={() => setEditando(true)} className="text-indigo-600 text-sm font-medium">
          Editar nome
        </button>
      )}
    </div>
  );
}
```

### 5.4 Critérios de aceite
- [ ] Avatar exibe imagem se existir, senão iniciais como fallback
- [ ] Nome exibido com fallback para email caso não exista
- [ ] Edição de nome persiste via `updateUser` e reflete imediatamente na UI
- [ ] Email sempre somente leitura

---

## 6. Seção Preferências

Fora de escopo nesta versão. A seção "Preferências" não será implementada agora (inclui tema claro/escuro — adiado). Manter apenas Perfil e Logout na página nesta rodada.

---

## 7. Seção Logout

### 7.1 Requisito funcional
Botão de logout na página de Configurações. Único local do app onde essa ação existe (não duplicar no Layout).

### 7.2 Componente de referência
```tsx
function SecaoLogout() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Sessão encerrada');
    } catch {
      toast.error('Erro ao sair');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-red-600 font-semibold flex items-center justify-center gap-2"
    >
      <LogOut size={18} />
      Sair da conta
    </button>
  );
}
```

### 7.3 Critérios de aceite
- [ ] Botão visível na página de Configurações
- [ ] Ao clicar, encerra sessão e redireciona para `/login` (redirecionamento já ocorre via `AuthContext` + proteção de rota existente)
- [ ] Erro exibe toast, não trava a UI

---

## 8. Página completa — estrutura de montagem

```tsx
// src/pages/Configuracoes.tsx
export default function Configuracoes() {
  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Configurações</h1>
      <SecaoPerfil />
      <SecaoLogout />
    </div>
  );
}
```

---

## 9. Resumo de arquivos afetados

| Arquivo | Ação |
|---|---|
| `src/pages/Configuracoes.tsx` | Criar |
| `src/components/Layout.tsx` | Editar — remover botão de logout do header, adicionar 4ª aba "Configurações" na nav |
| `src/App.tsx` | Editar — adicionar rota `/configuracoes` |

## 10. Dependências
Nenhuma dependência nova. `lucide-react`, `sonner`, `@supabase/supabase-js` já instaladas.

## 11. Fora de escopo desta spec
- Upload/alteração de avatar (armazenamento de imagem, Supabase Storage)
- Edição de email
- Tema claro/escuro (adiado — não implementar nesta rodada)
- Preferências adicionais (som de notificação, idioma, etc.) — não solicitadas nesta rodada