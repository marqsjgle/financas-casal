import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Database } from '../types';

type Cartao = Database['public']['Tables']['cartoes']['Row'];

interface CartaoForm {
  nome: string;
  tipo: 'debito' | 'credito';
  cor: string;
  dia_fechamento: number | null;
  dia_vencimento: number | null;
}

const CORES_PREDEFINIDAS = [
  '#4f46e5',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#111827',
];

function FormCartao({
  cartaoExistente,
  onSalvar,
  onCancelar,
}: {
  cartaoExistente?: CartaoForm & { id: string };
  onSalvar: () => void;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState<CartaoForm>(
    cartaoExistente || {
      nome: '',
      tipo: 'debito',
      cor: '#4f46e5',
      dia_fechamento: null,
      dia_vencimento: null,
    }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nome.trim()) {
      toast.error('Informe o nome do cartão');
      return;
    }

    if (form.tipo === 'credito') {
      if (!form.dia_fechamento || !form.dia_vencimento) {
        toast.error('Informe dia de fechamento e vencimento para cartão de crédito');
        return;
      }
    }

    setLoading(true);
    const payload = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      cor: form.cor,
      dia_fechamento: form.tipo === 'credito' ? form.dia_fechamento : null,
      dia_vencimento: form.tipo === 'credito' ? form.dia_vencimento : null,
    };

    const cartoesTable = supabase.from('cartoes') as any;
    const { error } = cartaoExistente
      ? await cartoesTable.update(payload).eq('id', cartaoExistente.id)
      : await cartoesTable.insert(payload);

    setLoading(false);
    if (error) {
      toast.error('Erro ao salvar cartão');
    } else {
      toast.success('Cartão salvo');
      onSalvar();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          {cartaoExistente ? 'Editar cartão' : 'Novo cartão'}
        </h2>
        <button
          type="button"
          onClick={onCancelar}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Nome</label>
        <input
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          placeholder="Nome do cartão"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Tipo</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setForm({ ...form, tipo: 'debito', dia_fechamento: null, dia_vencimento: null })
            }
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
              form.tipo === 'debito'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Débito
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, tipo: 'credito' })}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
              form.tipo === 'credito'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Crédito
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Cor</label>
        <div className="flex items-center gap-2 flex-wrap">
          {CORES_PREDEFINIDAS.map((cor) => (
            <button
              key={cor}
              type="button"
              onClick={() => setForm({ ...form, cor })}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                form.cor === cor ? 'border-gray-900 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: cor }}
              aria-label={`Selecionar cor ${cor}`}
            />
          ))}
          <input
            type="color"
            value={form.cor}
            onChange={(e) => setForm({ ...form, cor: e.target.value })}
            className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer"
            aria-label="Cor personalizada"
          />
        </div>
      </div>

      {form.tipo === 'credito' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Dia de fechamento</label>
            <input
              type="number"
              min={1}
              max={31}
              value={form.dia_fechamento ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  dia_fechamento: e.target.value ? Number(e.target.value) : null,
                })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Dia de vencimento</label>
            <input
              type="number"
              min={1}
              max={31}
              value={form.dia_vencimento ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  dia_vencimento: e.target.value ? Number(e.target.value) : null,
                })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Salvando...' : 'Salvar cartão'}
      </button>
    </form>
  );
}

export function Cartoes() {
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Cartao | null>(null);

  const carregar = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('cartoes').select('*').order('nome');
    if (error) {
      toast.error('Erro ao carregar cartões');
    } else {
      setCartoes((data as Cartao[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleSalvar = () => {
    setMostrarForm(false);
    setEditando(null);
    carregar();
  };

  const handleExcluir = async (id: string) => {
    const { error } = await supabase.from('cartoes').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir. Verifique se há lançamentos vinculados a este cartão.');
    } else {
      toast.success('Cartão excluído');
      carregar();
    }
  };

  const abrirNovo = () => {
    setEditando(null);
    setMostrarForm(true);
  };

  const abrirEdicao = (cartao: Cartao) => {
    setEditando(cartao);
    setMostrarForm(true);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/configuracoes" className="text-gray-400 hover:text-gray-600" aria-label="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Cartões</h1>
            <p className="text-sm text-gray-500">Gerencie seus cartões e faturas</p>
          </div>
        </div>
        {!mostrarForm && (
          <button
            type="button"
            onClick={abrirNovo}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo
          </button>
        )}
      </div>

      {mostrarForm && (
        <FormCartao
          cartaoExistente={
            editando
              ? {
                  id: editando.id,
                  nome: editando.nome,
                  tipo: editando.tipo,
                  cor: editando.cor,
                  dia_fechamento: editando.dia_fechamento,
                  dia_vencimento: editando.dia_vencimento,
                }
              : undefined
          }
          onSalvar={handleSalvar}
          onCancelar={() => {
            setMostrarForm(false);
            setEditando(null);
          }}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-pulse text-gray-400">Carregando cartões...</div>
        </div>
      ) : cartoes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
          Nenhum cartão cadastrado.
        </div>
      ) : (
        <div className="space-y-3">
          {cartoes.map((cartao) => (
            <div
              key={cartao.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: cartao.cor }}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{cartao.nome}</p>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                        cartao.tipo === 'credito'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cartao.tipo}
                    </span>
                  </div>
                  {cartao.tipo === 'credito' && cartao.dia_fechamento && cartao.dia_vencimento && (
                    <p className="text-xs text-gray-500">
                      Fecha dia {cartao.dia_fechamento} • Vence dia {cartao.dia_vencimento}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => abrirEdicao(cartao)}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                  aria-label="Editar cartão"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleExcluir(cartao.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Excluir cartão"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
