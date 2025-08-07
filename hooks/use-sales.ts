import { useState, useEffect } from 'react'
import { supabase, type Sale } from '@/lib/supabase'

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)

  const fetchSales = async (dateFilter?: string) => {
    try {
      setError(null)
      let query = supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })

      if (dateFilter) {
        query = query.eq('sale_date', dateFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase error:', error)
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          console.warn('Using fallback data - sales table may not be created yet')
          setSales([])
          setUsingFallback(true)
          setError('Las tablas de ventas no están configuradas.')
        } else {
          throw error
        }
      } else {
        setSales(data || [])
        setUsingFallback(false)
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
      setSales([])
      setUsingFallback(true)
      setError('Error conectando con la base de datos de ventas.')
    } finally {
      setLoading(false)
    }
  }

  const createSale = async (sale: Omit<Sale, 'id' | 'created_at'>) => {
    if (usingFallback) {
      // Simular creación en modo fallback
      const newSale = {
        ...sale,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      }
      setSales([newSale, ...sales])
      return newSale
    }

    try {
      const { data, error } = await supabase
        .from('sales')
        .insert([sale])
        .select()
        .single()

      if (error) throw error
      setSales([data, ...sales])
      return data
    } catch (error) {
      console.error('Error creating sale:', error)
      throw error
    }
  }

  const getSalesByDateRange = async (startDate: string, endDate: string) => {
    if (usingFallback) {
      return sales.filter(s => s.sale_date >= startDate && s.sale_date <= endDate)
    }

    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('sale_date', startDate)
        .lte('sale_date', endDate)
        .order('sale_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching sales by date range:', error)
      return []
    }
  }

  useEffect(() => {
    fetchSales()
  }, [])

  return {
    sales,
    loading,
    error,
    usingFallback,
    createSale,
    fetchSales,
    getSalesByDateRange,
    refetch: fetchSales
  }
}
