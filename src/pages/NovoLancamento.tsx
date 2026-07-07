import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Database } from '../types';
import { formatarMoeda } from '../lib/format';

type Categoria = Database['public']['Tables']['categorias']['Row'];
type Cartao = Database['public']['Tables']['cartoes']['Row'];

export function NovoLancamento() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  
  // Form state
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [cartaoId, setCartaoId] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<'debito' | 'credito' | 'pix' | 'dinheiro'>('pix');
  const [numeroParcelas, setNumeroParcelas] = useState(1);
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'));

  const valorNumerico = valor ? Number(valor) : 0;

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, cartRes] = await Promise.all([
          supabase.from('categorias').select('*').order('nome'),
          supabase.from('cartoes').select('*').order('nome'),
        ]);

        if (catRes.error) throw catRes.error;
        if (cartRes.error) throw cartRes.error;

        setCategorias((catRes.data as Categoria[]) || []);
        setCartoes((cartRes.data as Cartao[]) || []);
        
        if (catRes.data && catRes.data.length > 0) {
          setCategoriaId((catRes.data as Categoria[])[0].id);
        }
      } catch (error: any) {
        toast.error('Erro ao carregar dados: ' + error.message);
      } finally {
        setFetching(false);
      }
    }

    loadData();
  }, []);

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = (Number(value) / 100).toFixed(2);
    if (value === '0.00' && e.target.value === '') {
      setValor('');
      return;
    }
    setValor(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || Number(valor) <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    
    if (!user) return;

    try {
      setLoading(true);
      const payload = {
        valor: Number(valor),
        descricao,
        categoria_id: categoriaId,
        cartao_id: ['debito', 'credito'].includes(formaPagamento) ? cartaoId || null : null,
        forma_pagamento: formaPagamento,
        data,
        criado_por: user.id,
        numero_parcelas: formaPagamento === 'credito' ? numeroParcelas : 1,
      } as any;
      const { error } = await supabase.from('lancamentos').insert(payload);

      if (error) throw error;
      
      toast.success('Gasto salvo com sucesso!');
      
      // Reset form
      setValor('');
      setDescricao('');
      setFormaPagamento('pix');
      setCartaoId('');
      setNumeroParcelas(1);
      setData(format(new Date(), 'yyyy-MM-dd'));
      
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Carregando...</div></div>;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">Novo Lançamento</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Valor */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Valor</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-lg">R$</span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              required
              value={valor}
              onChange={handleValorChange}
              className="block w-full pl-10 pr-3 py-3 text-2xl font-semibold border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0,00"
            />
          </div>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Descrição</label>
          <input
            type="text"
            required
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ex: Almoço no shopping"
          />
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Categoria</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>
        </div>

        {/* Forma de Pagamento */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
          <div className="grid grid-cols-2 gap-2">
            {(['debito', 'credito', 'pix', 'dinheiro'] as const).map((forma) => (
              <button
                key={forma}
                type="button"
                onClick={() => {
                  setFormaPagamento(forma);
                  if (forma !== 'credito') {
                    setNumeroParcelas(1);
                  }
                }}
                className={`py-2 px-3 text-sm font-medium rounded-lg capitalize border transition-colors ${
                  formaPagamento === forma
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {forma}
              </button>
            ))}
          </div>
        </div>

        {/* Cartão (só mostra se débito ou crédito) */}
        {['debito', 'credito'].includes(formaPagamento) && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Cartão</label>
            <select
              value={cartaoId}
              onChange={(e) => setCartaoId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              required={['debito', 'credito'].includes(formaPagamento)}
            >
              <option value="">Selecione um cartão</option>
              {cartoes.filter(c => c.tipo === formaPagamento).map(cartao => (
                <option key={cartao.id} value={cartao.id}>{cartao.nome}</option>
              ))}
            </select>
          </div>
        )}

        {formaPagamento === 'credito' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Número de parcelas</label>
            <select
              value={numeroParcelas}
              onChange={(e) => setNumeroParcelas(Number(e.target.value))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n === 1
                    ? 'À vista (1x)'
                    : `${n}x de ${formatarMoeda(valorNumerico > 0 ? valorNumerico / n : 0)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Data */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Data</label>
          <input
            type="date"
            required
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        {/* Espaçador para o botão fixo não cobrir o último campo */}
        <div className="h-4"></div>
      </form>

      <div className="p-4 border-t border-gray-100 bg-white">
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Salvando...' : 'Salvar Gasto'}
        </button>
      </div>
    </div>
  );
}
