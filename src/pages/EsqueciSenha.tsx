import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) throw error;
      setEnviado(true);
    } catch {
      toast.error('Erro ao enviar email');
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8 space-y-6 text-center">
          <div className="mx-auto bg-indigo-100 p-3 rounded-full text-indigo-600 w-fit">
            <Mail className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">Verifique seu email</h1>
            <p className="text-sm text-gray-500">
              Se o email existir, enviamos um link de recuperação.
            </p>
          </div>
          <Link to="/login" className="block text-indigo-600 hover:text-indigo-700 font-medium">
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8 space-y-8">
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 mb-2">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Esqueci minha senha
          </h1>
          <p className="text-sm text-gray-500">
            Informe seu email para receber o link de recuperação
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="seu@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>

        <Link to="/login" className="block text-center text-sm text-gray-500 hover:text-gray-700">
          Voltar
        </Link>
      </div>
    </div>
  );
}
