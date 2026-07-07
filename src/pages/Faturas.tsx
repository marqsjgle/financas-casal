import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, ReceiptText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Database } from '../types';
import { calcularCicloFatura } from '../lib/fatura';

type Lancamento = Database['public']['Tables']['lancamentos']['Row'];
type Cartao = Database['public']['Tables']['cartoes']['Row'];

interface LancamentoComFatura extends Lancamento {
  fatura: string;
}

interface GrupoFatura {
  chave: string;
  cartaoNome: string;
  mesReferencia: number;
  anoReferencia: number;
  dataVencimento: Date;
  total: number;
  lancamentos: LancamentoComFatura[];
}

function agruparPorFatura(lancamentos: Lancamento[], cartoes: Cartao[]): GrupoFatura[] {
  const grupos: Record<string, GrupoFatura> = {};

  for (const lancamento of lancamentos) {
    if (lancamento.forma_pagamento !== 'credito' || !lancamento.cartao_id) continue;

    const cartao = cartoes.find((c) => c.id === lancamento.cartao_id);
    if (!cartao || !cartao.dia_fechamento || !cartao.dia_vencimento) continue;

    const ciclo = calcularCicloFatura(
      new Date(lancamento.data),
      cartao.dia_fechamento,
      cartao.dia_vencimento
    );

    const chave = `${cartao.nome} - ${ciclo.mesReferencia}/${ciclo.anoReferencia}`;

    if (!grupos[chave]) {
      grupos[chave] = {
        chave,
        cartaoNome: cartao.nome,
        mesReferencia: ciclo.mesReferencia,
        anoReferencia: ciclo.anoReferencia,
        dataVencimento: ciclo.dataVencimento,
        total: 0,
        lancamentos: [],
      };
    }

    grupos[chave].total += Number(lancamento.valor);
    grupos[chave].lancamentos.push({ ...lancamento, fatura: chave });
  }

  return Object.values(grupos).sort(
    (a, b) => b.dataVencimento.getTime() - a.dataVencimento.getTime()
  );
}

export function Faturas() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const [lancRes, cartRes] = await Promise.all([
          supabase.from('lancamentos').select('*').order('data', { ascending: false }),
          supabase.from('cartoes').select('*').order('nome'),
        ]);

        if (lancRes.error) throw lancRes.error;
        if (cartRes.error) throw cartRes.error;

        setLancamentos((lancRes.data as Lancamento[]) || []);
        setCartoes((cartRes.data as Cartao[]) || []);
      } catch (error: any) {
        toast.error('Erro ao carregar faturas: ' + error.message);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  const grupos = useMemo(() => agruparPorFatura(lancamentos, cartoes), [lancamentos, cartoes]);

  const nomeFatura = (grupo: GrupoFatura) => {
    const dataRef = new Date(grupo.anoReferencia, grupo.mesReferencia - 1, 1);
    return format(dataRef, 'MMMM/yyyy', { locale: ptBR });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 flex items-center gap-3">
        <Link to="/configuracoes" className="text-gray-400 hover:text-gray-600" aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Faturas</h1>
          <p className="text-sm text-gray-500">Gastos de crédito agrupados por ciclo</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-pulse text-gray-400">Carregando faturas...</div>
        </div>
      ) : grupos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
          Nenhuma fatura de crédito encontrada.
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map((grupo) => {
            const aberto = expandido === grupo.chave;
            return (
              <div
                key={grupo.chave}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandido(aberto ? null : grupo.chave)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <ReceiptText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{grupo.cartaoNome}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        Fatura {nomeFatura(grupo)} • vence{' '}
                        {format(grupo.dataVencimento, "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-gray-900">
                      R$ {grupo.total.toFixed(2).replace('.', ',')}
                    </span>
                    {aberto ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {aberto && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {grupo.lancamentos.map((item) => (
                      <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.descricao}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(item.data), "dd 'de' MMMM", { locale: ptBR })}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          R$ {Number(item.valor).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
