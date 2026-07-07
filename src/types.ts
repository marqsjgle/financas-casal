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
        }
        Insert: {
          id?: string
          nome: string
          tipo: 'debito' | 'credito'
          cor: string
        }
        Update: {
          id?: string
          nome?: string
          tipo?: 'debito' | 'credito'
          cor?: string
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
