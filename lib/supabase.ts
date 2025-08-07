import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos de datos
export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category: string
  min_stock: number
  created_at?: string
  updated_at?: string
}

export interface Sale {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total: number
  sale_date: string
  created_at?: string
}

export interface CashMovement {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  movement_date: string
  created_at?: string
}

export interface BalanceTransfer {
  id: string
  from_date: string
  to_date: string
  amount: number
  description: string
  transfer_date: string
  created_at?: string
}
