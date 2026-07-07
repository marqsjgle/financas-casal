import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { icons, ArrowLeft, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Database } from '../types';
import { DynamicIcon } from '../components/DynamicIcon';

type Categoria = Database['public']['Tables']['categorias']['Row'];

interface CategoriaForm {
  nome: string;
  icone: string;
  cor: string;
}

const ICONES_CATEGORIA = [
  'ShoppingCart', 'Coffee', 'Home', 'Car', 'Utensils', 'Heart',
  'Plane', 'Gamepad2', 'GraduationCap', 'Shirt', 'Dumbbell', 'Gift',
  'Fuel', 'Smartphone', 'Wifi', 'PawPrint', 'Baby', 'Stethoscope',
  'Wrench', 'Film', 'Music', 'Book', 'Briefcase', 'HelpCircle',
];

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

function SeletorIcone({
  selecionado,
  onSelecionar,
}: {
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
            className={`p-3 rounded-xl border flex items-center justify-center transition-colors ${
              selecionado === nomeIcone
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            aria-label={`Selecionar ícone ${nomeIcone}`}
          >
            <IconComponent size={20} />
          </button>
        );
      })}
    </div>
  );
}

function FormCategoria({
  categoriaExistente,
  onSalvar,
  onCancelar,
}: {
  categoriaExistente?: CategoriaForm & { id: string };
  onSalvar: () => void;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState<CategoriaForm>(
    categoriaExistente || { nome: '', icone: 'HelpCircle', cor: '#4f46e5' }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nome.trim()) {
      toast.error('Informe o nome da categoria');
      return;
    }

    if (!ICONES_CATEGORIA.includes(form.icone)) {
      toast.error('Selecione um ícone válido');
      return;
    }

    setLoading(true);
    const payload = {
      nome: form.nome.trim(),
      icone: form.icone,
      cor: form.cor,
    };

    const categoriasTable = supabase.from('categorias') as any;
    const { error } = categoriaExistente
      ? await categoriasTable.update(payload).eq('id', categoriaExistente.id)
      : await categoriasTable.insert(payload);

    setLoading(false);
    if (error) {
      toast.error('Erro ao salvar categoria');
    } else {
      toast.success('Categoria salva');
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
          {categoriaExistente ? 'Editar categoria' : 'Nova categoria'}
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
          placeholder="Nome da categoria"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Ícone</label>
        <SeletorIcone
          selecionado={form.icone}
          onSelecionar={(icone) => setForm({ ...form, icone })}
        />
      </div>

      <div className="space-y-2">
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

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Salvando...' : 'Salvar categoria'}
      </button>
    </form>
  );
}

export function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);

  const carregar = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('categorias').select('*').order('nome');
    if (error) {
      toast.error('Erro ao carregar categorias');
    } else {
      setCategorias((data as Categoria[]) || []);
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
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir. Verifique se há lançamentos vinculados a esta categoria.');
    } else {
      toast.success('Categoria excluída');
      carregar();
    }
  };

  const abrirNovo = () => {
    setEditando(null);
    setMostrarForm(true);
  };

  const abrirEdicao = (categoria: Categoria) => {
    setEditando(categoria);
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
            <h1 className="text-xl font-semibold text-gray-900">Categorias</h1>
            <p className="text-sm text-gray-500">Organize seus gastos por categoria</p>
          </div>
        </div>
        {!mostrarForm && (
          <button
            type="button"
            onClick={abrirNovo}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova
          </button>
        )}
      </div>

      {mostrarForm && (
        <FormCategoria
          categoriaExistente={
            editando
              ? {
                  id: editando.id,
                  nome: editando.nome,
                  icone: editando.icone,
                  cor: editando.cor,
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
          <div className="animate-pulse text-gray-400">Carregando categorias...</div>
        </div>
      ) : categorias.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
          Nenhuma categoria cadastrada.
        </div>
      ) : (
        <div className="space-y-3">
          {categorias.map((categoria) => (
            <div
              key={categoria.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: categoria.cor }}
                >
                  <DynamicIcon name={categoria.icone} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{categoria.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="w-3 h-3 rounded-full border border-gray-200"
                      style={{ backgroundColor: categoria.cor }}
                    />
                    <p className="text-xs text-gray-500">{categoria.icone}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => abrirEdicao(categoria)}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                  aria-label="Editar categoria"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleExcluir(categoria.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Excluir categoria"
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
