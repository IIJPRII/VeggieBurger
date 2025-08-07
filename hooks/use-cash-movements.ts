import { useState, useEffect } from 'react'
import { supabase, type CashMovement } from '@/lib/supabase'

export function useCashMovements() {
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)

  const fetchCashMovements = async (dateFilter?: string) => {
    try {
      setError(null)
      let query = supabase
        .from('cash_movements')
        .select('*')
        .order('created_at', { ascending: false })

      if (dateFilter) {
        query = query.eq('movement_date', dateFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase error:', error)
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          console.warn('Using fallback data - cash_movements table may not be created yet')
          setCashMovements([])
          setUsingFallback(true)
          setError('Las tablas de caja no están configuradas.')
        } else {
          throw error
        }
      } else {
        setCashMovements(data || [])
        setUsingFallback(false)
      }
    } catch (error) {
      console.error('Error fetching cash movements:', error)
      setCashMovements([])
      setUsingFallback(true)
      setError('Error conectando con la base de datos de caja.')
    } finally {
      setLoading(false)
    }
  }

  const createCashMovement = async (movement: Omit<CashMovement, 'id' | 'created_at'>) => {
    if (usingFallback) {
      // Simular creación en modo fallback
      const newMovement = {
        ...movement,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      }
      setCashMovements([newMovement, ...cashMovements])
      return newMovement
    }

    try {
      const { data, error } = await supabase
        .from('cash_movements')
        .insert([movement])
        .select()
        .single()

      if (error) throw error
      setCashMovements([data, ...cashMovements])
      return data
    } catch (error) {
      console.error('Error creating cash movement:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchCashMovements()
  }, [])

  return {
    cashMovements,
    loading,
    error,
    usingFallback,
    createCashMovement,
    fetchCashMovements,
    refetch: fetchCashMovements
  }
}
