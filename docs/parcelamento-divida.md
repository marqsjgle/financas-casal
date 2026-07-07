# Especificação Técnica — Parcelamento de Compras no Cartão de Crédito
## Projeto: Controle Financeiro Casal
**Para:** Agente de implementação (Cursor)
**Escopo desta spec:** Permitir registrar uma compra parcelada em N vezes no cartão de crédito, com valor fixo por parcela, exibida como um único lançamento e distribuída internamente entre as faturas seguintes.

**Depende de:** `spec-cartoes-fatura.md` (dia de fechamento/vencimento e cálculo de ciclo de fatura via `src/lib/fatura.ts`). Não implementar esta spec antes daquela estar concluída.

---

## 1. Contexto do projeto (obrigatório ler antes de implementar)

- Stack: React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + React Router DOM 7
- Backend: Supabase (Auth + PostgreSQL), client em `src/lib/supabase.ts`, tipagem em `src/types.ts`
- Tabela `lancamentos`: `id, valor, data, descricao, categoria_id, cartao_id, forma_pagamento, criado_por, criado_em`
- `forma_pagamento` é enum: `'debito' | 'credito' | 'pix' | 'dinheiro'`
- Função `calcularCicloFatura` já existe em `src/lib/fatura.ts` (da spec de Cartões) — calcula a qual fatura um gasto pertence dado dia de fechamento/vencimento
- Formulário de lançamento: `src/pages/NovoLancamento.tsx`
- Notificações: `sonner`

### 1.1 Decisão de produto confirmada
- Parcelamento se aplica **apenas a cartão de crédito**. Débito, pix e dinheiro não têm opção de parcelas.
- Uma compra parcelada aparece como **um único lançamento visível** no extrato, com o **valor total** da compra. A divisão em parcelas é **interna**, usada apenas para distribuir o valor entre as faturas mensais (seção 5).
- Valor de cada parcela é sempre `valor_total / numero_parcelas`, sem juros e sem variação mês a mês.

---

## 2. Alteração de schema (banco de dados)

### 2.1 Novo campo na tabela `lancamentos`

Como a decisão confirmada foi "1 lançamento visível, dividido apenas internamente entre faturas" (seção 1.1), basta um único campo novo — não é necessário criar registros duplicados por parcela:

| Coluna | Tipo | Regra |
|---|---|---|
| `numero_parcelas` | `integer` | Default `1`. Mínimo 1, máximo 24 (limite de segurança, ajustável). |

### 2.2 SQL de migração
```sql
ALTER TABLE lancamentos
  ADD COLUMN numero_parcelas integer NOT NULL DEFAULT 1;

ALTER TABLE lancamentos
  ADD CONSTRAINT numero_parcelas_valido CHECK (numero_parcelas >= 1 AND numero_parcelas <= 24);
```

### 2.3 Atualizar tipagem `src/types.ts`
Adicionar `numero_parcelas: number` ao tipo da tabela `lancamentos`.

### 2.4 Regra de integridade
`numero_parcelas > 1` só é válido quando `forma_pagamento === 'credito'`. Validar no formulário (seção 3) e, se possível, reforçar com constraint:

```sql
ALTER TABLE lancamentos
  ADD CONSTRAINT parcelas_apenas_credito CHECK (numero_parcelas = 1 OR forma_pagamento = 'credito');
```

---

## 3. Formulário — Alteração em `NovoLancamento.tsx`

### 3.1 Requisito funcional
Quando `forma_pagamento === 'credito'`, exibir campo adicional "Número de parcelas" (select ou stepper numérico, de 1 a 24). Quando não for crédito, o campo não aparece e `numero_parcelas` é enviado como `1`.

### 3.2 Componente de referência
```tsx
{formaPagamento === 'credito' && (
  <div>
    <label className="text-sm text-gray-500 mb-1 block">Número de parcelas</label>
    <select
      value={numeroParcelas}
      onChange={(e) => setNumeroParcelas(Number(e.target.value))}
      className="w-full border rounded-xl p-3"
    >
      {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
        <option key={n} value={n}>
          {n === 1 ? 'À vista (1x)' : `${n}x de ${formatarMoeda(valorNumerico / n)}`}
        </option>
      ))}
    </select>
  </div>
)}
```

`formatarMoeda` deve seguir o mesmo padrão já usado no projeto (formatação manual R$, conforme documento técnico base, seção 11).

### 3.3 Submit atualizado
```tsx
const payload = {
  valor: Number(valor), // valor TOTAL da compra, não da parcela
  descricao,
  categoria_id: categoriaId,
  cartao_id: ['debito', 'credito'].includes(forma) ? cartaoId : null,
  forma_pagamento,
  data,
  criado_por: user.id,
  numero_parcelas: forma_pagamento === 'credito' ? numeroParcelas : 1,
};
```

### 3.4 Reset do formulário
Após submissão bem-sucedida, resetar `numeroParcelas` para `1` (mesmo padrão de reset parcial já existente no formulário, que mantém categoria selecionada).

### 3.5 Critérios de aceite
- [ ] Campo de parcelas só aparece quando forma de pagamento é crédito
- [ ] Trocar forma de pagamento para débito/pix/dinheiro remove a seleção de parcelas (volta para 1)
- [ ] Valor salvo em `lancamentos.valor` é sempre o valor **total** da compra
- [ ] `numero_parcelas` é salvo corretamente junto ao lançamento

---

## 4. Exibição no Extrato

### 4.1 Requisito funcional
No `Extrato.tsx`, lançamentos com `numero_parcelas > 1` devem exibir indicação visual de parcelamento, sem alterar o valor mostrado (continua sendo o valor total).

### 4.2 Exemplo de exibição
```tsx
{lancamento.numero_parcelas > 1 && (
  <span className="text-xs text-gray-400 ml-1">
    ({lancamento.numero_parcelas}x de {formatarMoeda(lancamento.valor / lancamento.numero_parcelas)})
  </span>
)}
```

Exibido junto à descrição ou meta do lançamento (categoria • forma • cartão), sem alterar o layout existente de forma disruptiva.

### 4.3 Critérios de aceite
- [ ] Lançamento parcelado exibe "(Nx de R$ Y)" como informação complementar
- [ ] Lançamento não parcelado (`numero_parcelas === 1`) não exibe nenhuma indicação extra
- [ ] Valor principal exibido continua sendo o valor total, não o valor da parcela

---

## 5. Distribuição nas faturas (integração com `spec-cartoes-fatura.md`)

### 5.1 Requisito funcional
Na tela de Faturas (`src/pages/Faturas.tsx`, criada na spec de Cartões), um lançamento parcelado deve contribuir com **apenas o valor de uma parcela** em cada uma das N faturas subsequentes a partir do ciclo de compra — não o valor total em uma única fatura.

### 5.2 Lógica de distribuição
Esta é a parte tecnicamente mais delicada da feature. A função de agrupamento por fatura (`agruparPorFatura`, de `spec-cartoes-fatura.md`) precisa ser estendida:

```tsx
import { calcularCicloFatura } from '@/lib/fatura';
import { addMonths } from 'date-fns';

interface ParcelaDistribuida {
  lancamentoId: string;
  descricao: string;
  valorParcela: number;
  numeroParcela: number; // 1, 2, 3...
  totalParcelas: number;
  fatura: string; // chave da fatura, ex: "Nubank - 8/2026"
}

function distribuirParcelas(
  lancamentos: Lancamento[],
  cartoes: Cartao[]
): ParcelaDistribuida[] {
  const resultado: ParcelaDistribuida[] = [];

  for (const lancamento of lancamentos) {
    if (lancamento.forma_pagamento !== 'credito' || !lancamento.cartao_id) continue;

    const cartao = cartoes.find((c) => c.id === lancamento.cartao_id);
    if (!cartao || !cartao.dia_fechamento || !cartao.dia_vencimento) continue;

    const totalParcelas = lancamento.numero_parcelas || 1;
    const valorParcela = lancamento.valor / totalParcelas;
    const dataCompra = new Date(lancamento.data);

    // Calcula o ciclo da PRIMEIRA parcela (a compra em si)
    const cicloBase = calcularCicloFatura(dataCompra, cartao.dia_fechamento, cartao.dia_vencimento);

    for (let i = 0; i < totalParcelas; i++) {
      // Cada parcela subsequente cai um mês depois da anterior, no ciclo de fatura
      const mesReferenciaParcela = cicloBase.mesReferencia + i;
      const anoAjustado = cicloBase.anoReferencia + Math.floor((mesReferenciaParcela - 1) / 12);
      const mesAjustado = ((mesReferenciaParcela - 1) % 12) + 1;

      const chave = `${cartao.nome} - ${mesAjustado}/${anoAjustado}`;

      resultado.push({
        lancamentoId: lancamento.id,
        descricao: lancamento.descricao,
        valorParcela,
        numeroParcela: i + 1,
        totalParcelas,
        fatura: chave,
      });
    }
  }

  return resultado;
}
```

### 5.3 Agrupamento final por fatura
A tela de Faturas deve agrupar o resultado de `distribuirParcelas` (não mais os lançamentos brutos) pela chave `fatura`, somando `valorParcela` de todas as entradas daquele grupo — isso substitui a função `agruparPorFatura` original da spec de Cartões para lançamentos de crédito.

### 5.4 Exemplo concreto
Compra de R$ 1.200 em 3x no dia 10/07, cartão fecha dia 20, vence dia 28.
- Ciclo base (compra): fecha 20/07, vence 28/08 → fatura "Agosto/2026"
- Parcela 1/3 (R$ 400): fatura Agosto/2026
- Parcela 2/3 (R$ 400): fatura Setembro/2026
- Parcela 3/3 (R$ 400): fatura Outubro/2026

### 5.5 Critérios de aceite
- [ ] Compra parcelada em N vezes aparece distribuída em exatamente N faturas consecutivas
- [ ] Cada fatura recebe apenas o valor de uma parcela, não o valor total
- [ ] Soma de todas as parcelas de um lançamento é igual ao valor total original (sem perda de centavos por arredondamento — se houver resto de divisão, ajustar a última parcela para compensar, ver seção 5.6)
- [ ] Lançamento não-parcelado (`numero_parcelas === 1`) continua se comportando exatamente como antes desta spec

### 5.6 Nota sobre arredondamento
Divisões que não são exatas (ex: R$ 100 / 3 = R$ 33,33...) podem gerar diferença de centavos na soma. Recomenda-se: calcular `valorParcela = Math.floor((valor / totalParcelas) * 100) / 100` para as primeiras N-1 parcelas, e a última parcela recebe o valor residual (`valor - valorParcela * (totalParcelas - 1)`) para garantir que a soma bata exatamente com o valor total.

---

## 6. Resumo de arquivos afetados

| Arquivo | Ação |
|---|---|
| Banco (Supabase SQL Editor) | Executar migração da seção 2.2 e constraint da seção 2.4 |
| `src/types.ts` | Editar — adicionar `numero_parcelas` |
| `src/pages/NovoLancamento.tsx` | Editar — campo de parcelas condicional, ajuste no submit |
| `src/pages/Extrato.tsx` | Editar — exibir indicação de parcelamento |
| `src/lib/fatura.ts` ou novo `src/lib/parcelas.ts` | Criar/editar — função `distribuirParcelas` |
| `src/pages/Faturas.tsx` | Editar — usar `distribuirParcelas` no agrupamento, substituindo a lógica simples da spec de Cartões |

## 7. Dependências
Esta spec depende da spec `spec-cartoes-fatura.md` estar implementada primeiro (função `calcularCicloFatura` e página `Faturas.tsx` precisam existir).

## 8. Fora de escopo desta spec
- Parcelamento com juros ou valores variáveis por mês
- Edição de uma compra parcelada já lançada (ex: mudar de 6x para 3x depois de criada) — hoje só permite excluir e recriar (mesma limitação de UPDATE/DELETE do doc técnico base)
- Antecipação/quitação de parcelas restantes
- Visualização de "parcelas futuras" em telas fora da tela de Faturas