import { addMonths } from 'date-fns';
import { calcularCicloFatura } from './fatura';
import { Database } from '../types';

type Lancamento = Database['public']['Tables']['lancamentos']['Row'];
type Cartao = Database['public']['Tables']['cartoes']['Row'];

export interface ParcelaDistribuida {
  lancamentoId: string;
  descricao: string;
  valorParcela: number;
  numeroParcela: number;
  totalParcelas: number;
  fatura: string;
  cartaoNome: string;
  mesReferencia: number;
  anoReferencia: number;
  dataVencimento: Date;
}

export interface GrupoFatura {
  chave: string;
  cartaoNome: string;
  mesReferencia: number;
  anoReferencia: number;
  dataVencimento: Date;
  total: number;
  parcelas: ParcelaDistribuida[];
}

export function calcularValoresParcelas(valorTotal: number, totalParcelas: number): number[] {
  if (totalParcelas <= 1) {
    return [valorTotal];
  }

  const valorBase = Math.floor((valorTotal / totalParcelas) * 100) / 100;
  const valores = Array.from({ length: totalParcelas - 1 }, () => valorBase);
  const ultima =
    Math.round((valorTotal - valorBase * (totalParcelas - 1)) * 100) / 100;
  valores.push(ultima);

  return valores;
}

export function distribuirParcelas(
  lancamentos: Lancamento[],
  cartoes: Cartao[]
): ParcelaDistribuida[] {
  const resultado: ParcelaDistribuida[] = [];

  for (const lancamento of lancamentos) {
    if (lancamento.forma_pagamento !== 'credito' || !lancamento.cartao_id) continue;

    const cartao = cartoes.find((c) => c.id === lancamento.cartao_id);
    if (!cartao || !cartao.dia_fechamento || !cartao.dia_vencimento) continue;

    const totalParcelas = lancamento.numero_parcelas || 1;
    const valoresParcelas = calcularValoresParcelas(Number(lancamento.valor), totalParcelas);
    const dataCompra = new Date(lancamento.data);

    const cicloBase = calcularCicloFatura(
      dataCompra,
      cartao.dia_fechamento,
      cartao.dia_vencimento
    );

    for (let i = 0; i < totalParcelas; i++) {
      const mesReferenciaParcela = cicloBase.mesReferencia + i;
      const anoAjustado =
        cicloBase.anoReferencia + Math.floor((mesReferenciaParcela - 1) / 12);
      const mesAjustado = ((mesReferenciaParcela - 1) % 12) + 1;

      const chave = `${cartao.nome} - ${mesAjustado}/${anoAjustado}`;

      resultado.push({
        lancamentoId: lancamento.id,
        descricao: lancamento.descricao,
        valorParcela: valoresParcelas[i],
        numeroParcela: i + 1,
        totalParcelas,
        fatura: chave,
        cartaoNome: cartao.nome,
        mesReferencia: mesAjustado,
        anoReferencia: anoAjustado,
        dataVencimento: addMonths(cicloBase.dataVencimento, i),
      });
    }
  }

  return resultado;
}

export function agruparParcelasPorFatura(parcelas: ParcelaDistribuida[]): GrupoFatura[] {
  const grupos: Record<string, GrupoFatura> = {};

  for (const parcela of parcelas) {
    if (!grupos[parcela.fatura]) {
      grupos[parcela.fatura] = {
        chave: parcela.fatura,
        cartaoNome: parcela.cartaoNome,
        mesReferencia: parcela.mesReferencia,
        anoReferencia: parcela.anoReferencia,
        dataVencimento: parcela.dataVencimento,
        total: 0,
        parcelas: [],
      };
    }

    grupos[parcela.fatura].total += parcela.valorParcela;
    grupos[parcela.fatura].parcelas.push(parcela);
  }

  return Object.values(grupos).sort(
    (a, b) => b.dataVencimento.getTime() - a.dataVencimento.getTime()
  );
}
