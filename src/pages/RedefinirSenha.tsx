import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export function RedefinirSenha() {
  const [novaSenha, setNovaSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: novaSenha });

      if (error) throw error;
      toast.success('Senha alterada com sucesso');
      navigate('/login');
    } catch {
      toast.error('Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8 space-y-8">
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 mb-2">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Nova senha
          </h1>
          <p className="text-sm text-gray-500">
            Defina uma nova senha para acessar sua conta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nova senha</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Mínimo de 6 caracteres"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>

        <Link to="/login" className="block text-center text-sm text-gray-500 hover:text-gray-700">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
