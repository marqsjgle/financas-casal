import React, { useState } from 'react';
import { Edit2, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

function SecaoPerfil() {
  const { user } = useAuth();
  const [nome, setNome] = useState(user?.user_metadata?.nome || '');
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url;
  const nomeExibido = nome || user?.email || 'Usuário';
  const iniciais = nomeExibido.charAt(0).toUpperCase();

  const handleSalvar = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        data: { nome: nome.trim() },
      });

      if (error) throw error;
      toast.success('Nome atualizado');
      setNome(nome.trim());
      setEditando(false);
    } catch {
      toast.error('Erro ao salvar nome');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    setNome(user?.user_metadata?.nome || '');
    setEditando(false);
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-indigo-600" />
        <h2 className="font-semibold text-gray-900">Perfil</h2>
      </div>

      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-semibold">
            {iniciais}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {editando ? (
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Seu nome"
            />
          ) : (
            <p className="font-medium text-gray-900 truncate">{nomeExibido}</p>
          )}
          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
        </div>
      </div>

      {editando ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSalvar}
            disabled={loading}
            className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            type="button"
            onClick={handleCancelar}
            disabled={loading}
            className="text-gray-500 text-sm font-medium px-3 py-2 hover:text-gray-700 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:text-indigo-700"
        >
          <Edit2 className="w-4 h-4" />
          Editar nome
        </button>
      )}
    </section>
  );
}

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
      type="button"
      onClick={handleLogout}
      className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-red-600 font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
    >
      <LogOut className="w-5 h-5" />
      Sair da conta
    </button>
  );
}

export function Configuracoes() {
  return (
    <div className="flex flex-col h-full bg-gray-50 space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie seu perfil e sua sessão</p>
      </div>

      <SecaoPerfil />
      <SecaoLogout />
    </div>
  );
}
