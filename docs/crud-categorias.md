# Especificação Técnica — CRUD de Categorias
## Projeto: Controle Financeiro Casal
**Para:** Agente de implementação (Cursor)
**Escopo desta spec:** Tela de criação, edição e exclusão de categorias

---

## 1. Contexto do projeto (obrigatório ler antes de implementar)

- Stack: React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + React Router DOM 7
- Backend: Supabase (Auth + PostgreSQL), client em `src/lib/supabase.ts`, tipagem em `src/types.ts`
- Tabela atual `categorias`: `id (uuid)`, `nome (string)`, `cor (string)`, `icone (string — nome de ícone Lucide)`
- Hoje o cadastro de categorias é feito manualmente no Supabase Dashboard. Esta spec substitui isso por uma tela no app.
- Componente `src/components/DynamicIcon.tsx` já existe: recebe `name` (string), converte para PascalCase, busca em `lucide-react`, fallback `HelpCircle` se não encontrar
- Notificações: `sonner`
- Padrão visual: cards `rounded-2xl`, `shadow-sm`, `border-gray-100`, cor primária indigo (`#4f46e5`), mobile-first, `max-w-md`
- Referência de comportamento: esta spec segue o mesmo padrão estrutural da spec de CRUD de Cartões (`spec-cartoes-fatura.md`) — listagem, formulário condicional, exclusão com RESTRICT

**Contexto adicional:** o select de Categoria na tela `NovoLancamento.tsx` está atualmente aparecendo vazio/quebrado (ver captura de tela fornecida pelo usuário) — provável sintoma de não haver categorias cadastradas ou problema na carga dos dados. Esta feature não corrige bugs de renderização do select existente; ela resolve o problema de fundo (permitir cadastrar categorias direto no app). Se o select continuar quebrado após esta implementação, é um bug separado a ser investigado à parte.

---

## 2. Não há alteração de schema

A tabela `categorias` já possui os campos necessários (`nome`, `cor`, `icone`). Nenhuma migração de banco é necessária para esta spec.

---

## 3. CRUD de Categorias — Nova tela

### 3.1 Requisito funcional
Nova página para listar, criar, editar e excluir categorias.

### 3.2 Rota
**Arquivo:** `src/pages/Categorias.tsx`
**Rota em `App.tsx`:**
```tsx
<Route path="/categorias" element={<Categorias />} />
```
Rota protegida. Adicionar link de acesso na página de Configurações (`src/pages/Configuracoes.tsx`).

### 3.3 Listagem
- Lista todas as categorias (`select('*').order('nome')`)
- Cada item exibe: ícone (via `DynamicIcon`), nome, indicador de cor
- Botões de editar e excluir por item

### 3.4 Formulário (criar/editar)

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| Nome | text | Sim | Não vazio |
| Ícone | seletor de ícones | Sim | Deve ser um nome válido de ícone Lucide |
| Cor | color picker | Sim | Hex válido |

### 3.5 Seletor de ícones — abordagem
Não é viável (nem necessário) listar todos os ícones do Lucide. Usar uma lista curta e curada de ícones relevantes para categorias financeiras, exibidos em grade, cada um clicável:

```tsx
const ICONES_CATEGORIA = [
  'ShoppingCart', 'Coffee', 'Home', 'Car', 'Utensils', 'Heart',
  'Plane', 'Gamepad2', 'GraduationCap', 'Shirt', 'Dumbbell', 'Gift',
  'Fuel', 'Smartphone', 'Wifi', 'PawPrint', 'Baby', 'Stethoscope',
  'Wrench', 'Film', 'Music', 'Book', 'Briefcase', 'HelpCircle',
];
```

Componente de referência:
```tsx
import { icons } from 'lucide-react';

function SeletorIcone({ selecionado, onSelecionar }: {
  selecionado: string;
  onSelecionar: (nome: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {ICONES_CATEGORIA.map((nomeIcone) => {
        const IconComponent = icons[nomeIcone as keyof typeof icons];
        if (!IconComponent) return null;
        return (
          <button
            key={nomeIcone}
            type="button"
            onClick={() => onSelecionar(nomeIcone)}
            className={`p-3 rounded-xl border flex items-center justify-center ${
              selecionado === nomeIcone ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-200'
            }`}
          >
            <IconComponent size={20} />
          </button>
        );
      })}
    </div>
  );
}
```

### 3.6 Componente de referência — Formulário completo
```tsx
interface CategoriaForm {
  nome: string;
  icone: string;
  cor: string;
}

function FormCategoria({ categoriaExistente, onSalvar }: {
  categoriaExistente?: CategoriaForm & { id: string };
  onSalvar: () => void;
}) {
  const [form, setForm] = useState<CategoriaForm>(
    categoriaExistente || { nome: '', icone: 'HelpCircle', cor: '#4f46e5' }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = categoriaExistente
      ? await supabase.from('categorias').update(form).eq('id', categoriaExistente.id)
      : await supabase.from('categorias').insert(form);

    setLoading(false);
    if (error) {
      toast.error('Erro ao salvar categoria');
    } else {
      toast.success('Categoria salva');
      onSalvar();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        value={form.nome}
        onChange={(e) => setForm({ ...form, nome: e.target.value })}
        placeholder="Nome da categoria"
        required
        className="w-full border rounded-xl p-3"
      />

      <div>
        <label className="text-sm text-gray-500 mb-2 block">Ícone</label>
        <SeletorIcone selecionado={form.icone} onSelecionar={(icone) => setForm({ ...form, icone })} />
      </div>

      <div>
        <label className="text-sm text-gray-500 mb-2 block">Cor</label>
        <input
          type="color"
          value={form.cor}
          onChange={(e) => setForm({ ...form, cor: e.target.value })}
          className="w-full h-12 rounded-xl"
        />
      </div>

      <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white rounded-xl p-3 font-semibold">
        {loading ? 'Salvando...' : 'Salvar categoria'}
      </button>
    </form>
  );
}
```

### 3.7 Exclusão
Comportamento confirmado: **igual ao padrão de cartões — RESTRICT.** Categoria com lançamentos vinculados não pode ser excluída.

```sql
ALTER TABLE lancamentos
  ADD CONSTRAINT fk_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT;
```
(Só executar se a constraint ainda não existir — verificar antes no Supabase.)

```tsx
const handleExcluir = async (id: string) => {
  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) {
    toast.error('Erro ao excluir. Verifique se há lançamentos vinculados a esta categoria.');
  } else {
    toast.success('Categoria excluída');
  }
};
```

### 3.8 Link de acesso
Adicionar item "Categorias" na página de Configurações (`src/pages/Configuracoes.tsx`), como link/card navegando para `/categorias`.

### 3.9 Critérios de aceite
- [ ] Lista todas as categorias com ícone, nome e cor
- [ ] Criar categoria exige nome e ícone válidos
- [ ] Editar categoria existente pré-preenche o formulário corretamente
- [ ] Excluir categoria com lançamentos vinculados é bloqueado (RESTRICT), com mensagem de erro clara
- [ ] Ícone escolhido renderiza corretamente via `DynamicIcon` nas outras telas (Extrato, NovoLancamento) sem precisar de alteração nesses componentes

---

## 4. Resumo de arquivos afetados

| Arquivo | Ação |
|---|---|
| Banco (Supabase SQL Editor) | Verificar/adicionar constraint RESTRICT em `lancamentos.categoria_id` |
| `src/pages/Categorias.tsx` | Criar |
| `src/App.tsx` | Editar — adicionar rota `/categorias` |
| `src/pages/Configuracoes.tsx` | Editar — adicionar link para `/categorias` |

## 5. Dependências
Nenhuma dependência nova. `lucide-react` já instalada e já expõe o objeto `icons` usado no seletor.

## 6. Fora de escopo desta spec
- Correção do bug de renderização do select de Categoria em `NovoLancamento.tsx` (investigar separadamente se persistir após esta implementação)
- Reordenação/drag-and-drop de categorias
- Categorias padrão pré-cadastradas via seed (fica a critério do usuário popular manualmente após o deploy)