import { useState, useEffect } from 'react'
import { supabase, type Product } from '@/lib/supabase'

// Datos de fallback en caso de que las tablas no existan
const fallbackProducts: Product[] = [
  {
    id: "1",
    name: "Laptop HP",
    description: "Laptop HP Pavilion 15.6\"",
    price: 850000,
    stock: 5,
    category: "Electrónicos",
    min_stock: 2
  },
  {
    id: "2", 
    name: "Mouse Logitech",
    description: "Mouse inalámbrico Logitech MX Master",
    price: 45000,
    stock: 15,
    category: "Accesorios",
    min_stock: 5
  }
]

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)

  const fetchProducts = async () => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        // Si hay error con la tabla, usar datos de fallback
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          console.warn('Using fallback data - tables may not be created yet')
          setProducts(fallbackProducts)
          setUsingFallback(true)
          setError('Las tablas de la base de datos no están configuradas. Usando datos de ejemplo.')
        } else {
          throw error
        }
      } else {
        setProducts(data || [])
        setUsingFallback(false)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts(fallbackProducts)
      setUsingFallback(true)
      setError('Error conectando con la base de datos. Usando datos de ejemplo.')
    } finally {
      setLoading(false)
    }
  }

  const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    if (usingFallback) {
      // Simular creación en modo fallback
      const newProduct = {
        ...product,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setProducts([newProduct, ...products])
      return newProduct
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single()

      if (error) throw error
      setProducts([data, ...products])
      return data
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (usingFallback) {
      // Simular actualización en modo fallback
      const updatedProducts = products.map(p => 
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      )
      setProducts(updatedProducts)
      return updatedProducts.find(p => p.id === id)
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setProducts(products.map(p => p.id === id ? data : p))
      return data
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  const deleteProduct = async (id: string) => {
    if (usingFallback) {
      // Simular eliminación en modo fallback
      setProducts(products.filter(p => p.id !== id))
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      setProducts(products.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return {
    products,
    loading,
    error,
    usingFallback,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts
  }
}
