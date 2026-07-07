import { getDate, getDaysInMonth, addMonths, setDate } from 'date-fns';

export interface CicloFatura {
  mesReferencia: number; // 1-12
  anoReferencia: number;
  dataFechamento: Date;
  dataVencimento: Date;
}

/**
 * Calcula a qual ciclo de fatura um gasto pertence, dado o dia de fechamento
 * e dia de vencimento configurados no cartão.
 */
export function calcularCicloFatura(
  dataGasto: Date,
  diaFechamento: number,
  diaVencimento: number
): CicloFatura {
  const diaGasto = getDate(dataGasto);
  const mesBase = dataGasto;

  // Ajusta dia para o último dia do mês, se necessário (ex: dia 31 em fevereiro)
  const ajustarDia = (data: Date, dia: number) => {
    const maxDia = getDaysInMonth(data);
    return setDate(data, Math.min(dia, maxDia));
  };

  let mesFechamento = mesBase;
  if (diaGasto > diaFechamento) {
    mesFechamento = addMonths(mesBase, 1);
  }

  const dataFechamento = ajustarDia(mesFechamento, diaFechamento);

  // Vencimento: assume-se no mês seguinte ao fechamento (padrão de mercado).
  const mesVencimento = addMonths(mesFechamento, 1);
  const dataVencimento = ajustarDia(mesVencimento, diaVencimento);

  return {
    mesReferencia: dataVencimento.getMonth() + 1,
    anoReferencia: dataVencimento.getFullYear(),
    dataFechamento,
    dataVencimento,
  };
}
