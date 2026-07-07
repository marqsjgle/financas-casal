export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categorias: {
        Row: {
          id: string
          nome: string
          cor: string
          icone: string
        }
        Insert: {
          id?: string
          nome: string
          cor: string
          icone: string
        }
        Update: {
          id?: string
          nome?: string
          cor?: string
          icone?: string
        }
      }
      cartoes: {
        Row: {
          id: string
          nome: string
          tipo: 'debito' | 'credito'
          cor: string
          dia_fechamento: number | null
          dia_vencimento: number | null
        }
        Insert: {
          id?: string
          nome: string
          tipo: 'debito' | 'credito'
          cor: string
          dia_fechamento?: number | null
          dia_vencimento?: number | null
        }
        Update: {
          id?: string
          nome?: string
          tipo?: 'debito' | 'credito'
          cor?: string
          dia_fechamento?: number | null
          dia_vencimento?: number | null
        }
      }
      lancamentos: {
        Row: {
          id: string
          valor: number
          data: string
          descricao: string
          categoria_id: string
          cartao_id: string | null
          forma_pagamento: 'debito' | 'credito' | 'pix' | 'dinheiro'
          criado_por: string
          criado_em: string
          numero_parcelas: number
        }
        Insert: {
          id?: string
          valor: number
          data: string
          descricao: string
          categoria_id: string
          cartao_id?: string | null
          forma_pagamento: 'debito' | 'credito' | 'pix' | 'dinheiro'
          criado_por: string
          criado_em?: string
          numero_parcelas?: number
        }
        Update: {
          id?: string
          valor?: number
          data?: string
          descricao?: string
          categoria_id?: string
          cartao_id?: string | null
          forma_pagamento?: 'debito' | 'credito' | 'pix' | 'dinheiro'
          criado_por?: string
          criado_em?: string
          numero_parcelas?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
