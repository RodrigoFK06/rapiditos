import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Order, User, Restaurant } from '@/lib/types'

interface OrderRelatedData {
  client: User | null
  restaurant: Restaurant | null
  isLoading: boolean
  errors: {
    client?: string
    restaurant?: string
  }
}

export function useOrderRelatedData(order: Order | null): OrderRelatedData {
  const [client, setClient] = useState<User | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ client?: string; restaurant?: string }>({})

  const loadRelatedData = useCallback(async (orderData: Order) => {
    if (!orderData) return

    setIsLoading(true)
    setErrors({})

    // Crear promesas para carga paralela
    const promises: Promise<any>[] = []
    const promiseKeys: string[] = []

    // Solo cargar cliente si existe referencia
    if (orderData.cliente_ref) {
      promises.push(getDoc(orderData.cliente_ref))
      promiseKeys.push('client')
    }

    // Solo cargar restaurante si existe referencia
    if (orderData.restaurantref) {
      promises.push(getDoc(orderData.restaurantref))
      promiseKeys.push('restaurant')
    }

    if (promises.length === 0) {
      setIsLoading(false)
      return
    }

    try {
      // Ejecutar todas las consultas en paralelo
      const results = await Promise.allSettled(promises)

      const newErrors: { client?: string; restaurant?: string } = {}

      // Procesar resultados
      results.forEach((result, index) => {
        const key = promiseKeys[index]

        if (result.status === 'fulfilled') {
          const snapshot = result.value
          if (snapshot.exists()) {
            const data = { id: snapshot.id, ...snapshot.data() }
            
            if (key === 'client') {
              setClient(data as User)
            } else if (key === 'restaurant') {
              setRestaurant(data as Restaurant)
            }
          } else {
            newErrors[key as keyof typeof newErrors] = 'Documento no encontrado'
          }
        } else {
          // Error en la consulta
          newErrors[key as keyof typeof newErrors] = 
            result.reason instanceof Error 
              ? result.reason.message 
              : 'Error al cargar datos'
        }
      })

      setErrors(newErrors)
    } catch (error) {
      console.error('Error loading related data:', error)
      setErrors({
        client: 'Error general al cargar cliente',
        restaurant: 'Error general al cargar restaurante'
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (order) {
      loadRelatedData(order)
    } else {
      // Reset cuando no hay order
      setClient(null)
      setRestaurant(null)
      setErrors({})
      setIsLoading(false)
    }
  }, [order, loadRelatedData])

  return {
    client,
    restaurant,
    isLoading,
    errors
  }
}

// Hook más genérico para cualquier tipo de carga paralela
interface ParallelDataLoader<T> {
  key: string
  fetcher: () => Promise<T>
}

export function useParallelData<T extends Record<string, any>>(
  loaders: ParallelDataLoader<any>[],
  dependencies: any[] = []
) {
  const [data, setData] = useState<Partial<T>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loadData = useCallback(async () => {
    if (loaders.length === 0) return

    setIsLoading(true)
    setErrors({})

    const promises = loaders.map(loader => loader.fetcher())
    const keys = loaders.map(loader => loader.key)

    try {
      const results = await Promise.allSettled(promises)
      
      const newData: Partial<T> = {}
      const newErrors: Record<string, string> = {}

      results.forEach((result, index) => {
        const key = keys[index]
        
        if (result.status === 'fulfilled') {
          newData[key as keyof T] = result.value
        } else {
          newErrors[key] = result.reason instanceof Error 
            ? result.reason.message 
            : 'Error desconocido'
        }
      })

      setData(newData)
      setErrors(newErrors)
    } catch (error) {
      console.error('Error in parallel data loading:', error)
      const allErrors = keys.reduce((acc, key) => {
        acc[key] = 'Error general de carga'
        return acc
      }, {} as Record<string, string>)
      setErrors(allErrors)
    } finally {
      setIsLoading(false)
    }
  }, [loaders])

  useEffect(() => {
    loadData()
  }, dependencies)

  return {
    data,
    isLoading,
    errors,
    refetch: loadData
  }
}
