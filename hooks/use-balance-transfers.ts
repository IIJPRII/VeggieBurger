import { useState, useEffect } from 'react'
import { supabase, type BalanceTransfer } from '@/lib/supabase'

export function useBalanceTransfers() {
  const [balanceTransfers, setBalanceTransfers] = useState<BalanceTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)

  const fetchBalanceTransfers = async () => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('balance_transfers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          console.warn('Using fallback data - balance_transfers table may not be created yet')
          setBalanceTransfers([])
          setUsingFallback(true)
          setError('Las tablas de traslados no están configuradas.')
        } else {
          throw error
        }
      } else {
        setBalanceTransfers(data || [])
        setUsingFallback(false)
      }
    } catch (error) {
      console.error('Error fetching balance transfers:', error)
      setBalanceTransfers([])
      setUsingFallback(true)
      setError('Error conectando con la base de datos de traslados.')
    } finally {
      setLoading(false)
    }
  }

  const createBalanceTransfer = async (transfer: Omit<BalanceTransfer, 'id' | 'created_at'>) => {
    if (usingFallback) {
      // Simular creación en modo fallback
      const newTransfer = {
        ...transfer,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      }
      setBalanceTransfers([newTransfer, ...balanceTransfers])
      return newTransfer
    }

    try {
      const { data, error } = await supabase
        .from('balance_transfers')
        .insert([transfer])
        .select()
        .single()

      if (error) throw error
      setBalanceTransfers([data, ...balanceTransfers])
      return data
    } catch (error) {
      console.error('Error creating balance transfer:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchBalanceTransfers()
  }, [])

  return {
    balanceTransfers,
    loading,
    error,
    usingFallback,
    createBalanceTransfer,
    refetch: fetchBalanceTransfers
  }
}
