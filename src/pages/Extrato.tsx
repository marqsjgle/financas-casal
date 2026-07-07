import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Database } from '../types';
import { DynamicIcon } from '../components/DynamicIcon';

type Lancamento = Database['public']['Tables']['lancamentos']['Row'] & {
  categorias?: { nome: string; cor: string; icone: string };
  cartoes?: { nome: string };
};

export function Extrato() {
  const { user } = useAuth();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLancamentos() {
      try {
        const { data, error } = await supabase
          .from('lancamentos')
          .select(`
            *,
            categorias (nome, cor, icone),
            cartoes (nome)
          `)
          .order('data', { ascending: false })
          .order('criado_em', { ascending: false });

        if (error) throw error;
        setLancamentos(data as Lancamento[]);
      } catch (error: any) {
        toast.error('Erro ao carregar extrato: ' + error.message);
      } finally {
        setLoading(false);
      }
    }

    loadLancamentos();

    // Configurar Realtime
    const channel = supabase
      .channel('lancamentos_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lancamentos',
        },
        async (payload) => {
          const novo = payload.new as Lancamento;
          
          // Buscar os relacionamentos do novo lançamento
          const { data: categoria } = await supabase
            .from('categorias')
            .select('nome, cor, icone')
            .eq('id', novo.categoria_id)
            .single();

          const { data: cartao } = novo.cartao_id
            ? await supabase
                .from('cartoes')
                .select('nome')
                .eq('id', novo.cartao_id)
                .single()
            : { data: null };

          const novoCompleto = {
            ...novo,
            categorias: categoria || undefined,
            cartoes: cartao || undefined,
          };

          setLancamentos((prev) => [novoCompleto, ...prev].sort((a, b) => {
            const dateA = new Date(a.data).getTime();
            const dateB = new Date(b.data).getTime();
            if (dateA !== dateB) return dateB - dateA;
            return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
          }));

          // Notificação se for outro usuário
          if (novo.criado_por !== user?.id) {
            const catName = categoria ? (categoria as any).nome : 'Nova categoria';
            toast.info(`Novo gasto lançado: R$ ${novo.valor.toFixed(2)} em ${catName}`, {
              icon: '💸',
              duration: 5000,
            });
            // Tocar som (simplificado)
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.play().catch(e => console.log('Audio play error:', e));
            } catch (e) {}
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Carregando extrato...</div></div>;
  }

  // Agrupar por data
  const grouped = lancamentos.reduce((acc, curr) => {
    const dataStr = curr.data;
    if (!acc[dataStr]) {
      acc[dataStr] = [];
    }
    acc[dataStr].push(curr);
    return acc;
  }, {} as Record<string, Lancamento[]>);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">Extrato</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center text-gray-500 py-10">Nenhum lançamento encontrado.</div>
        ) : (
          Object.keys(grouped).map(dateStr => (
            <div key={dateStr} className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500 border-b border-gray-100 pb-1">
                {format(parseISO(dateStr), "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </h3>
              <div className="space-y-3">
                {grouped[dateStr].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: item.categorias?.cor || '#ccc' }}
                      >
                        <DynamicIcon name={item.categorias?.icone || 'Tag'} className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.descricao}</p>
                        <p className="text-xs text-gray-500">
                          {item.categorias?.nome} • {item.forma_pagamento}
                          {item.cartoes && ` • ${item.cartoes.nome}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        R$ {Number(item.valor).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {item.criado_por === user?.id ? 'Você' : 'Parceiro'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
