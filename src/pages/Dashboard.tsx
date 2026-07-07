import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [totalMes, setTotalMes] = useState(0);
  const [dadosCategoria, setDadosCategoria] = useState<{name: string, value: number, color: string}[]>([]);
  const [dadosCartao, setDadosCartao] = useState<{name: string, value: number}[]>([]);
  
  const currentMonth = new Date();

  useEffect(() => {
    async function loadDashboard() {
      try {
        const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

        const { data, error } = await supabase
          .from('lancamentos')
          .select(`
            valor,
            categorias (nome, cor),
            cartoes (nome)
          `)
          .gte('data', start)
          .lte('data', end);

        if (error) throw error;

        let total = 0;
        const porCategoria: Record<string, {value: number, color: string}> = {};
        const porCartao: Record<string, number> = {};

        data.forEach((item: any) => {
          total += Number(item.valor);
          
          // Categoria
          if (item.categorias) {
            const catNome = item.categorias.nome;
            if (!porCategoria[catNome]) {
              porCategoria[catNome] = { value: 0, color: item.categorias.cor };
            }
            porCategoria[catNome].value += Number(item.valor);
          }

          // Cartão
          if (item.cartoes) {
            const cartNome = item.cartoes.nome;
            porCartao[cartNome] = (porCartao[cartNome] || 0) + Number(item.valor);
          }
        });

        setTotalMes(total);
        
        setDadosCategoria(
          Object.entries(porCategoria).map(([name, {value, color}]) => ({ name, value, color }))
        );

        setDadosCartao(
          Object.entries(porCartao).map(([name, value]) => ({ name, value }))
        );

      } catch (error) {
        console.error('Erro ao carregar dashboard', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Carregando dashboard...</div></div>;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
        <span className="text-sm text-gray-500 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        <div className="bg-indigo-600 rounded-2xl p-6 text-white text-center shadow-md">
          <p className="text-indigo-100 text-sm font-medium mb-1">Total Gasto no Mês</p>
          <p className="text-4xl font-bold">
            R$ {totalMes.toFixed(2).replace('.', ',')}
          </p>
        </div>

        {dadosCategoria.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Por Categoria</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dadosCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {dadosCategoria.map((cat, i) => (
                <div key={i} className="flex items-center text-xs text-gray-600">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cat.color }}></div>
                  <span className="truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {dadosCartao.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">Por Cartão</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosCartao} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
