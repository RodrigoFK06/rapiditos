import { useState, useEffect } from 'react'
import { Order } from '@/lib/types'
import { getOrderById } from '@/lib/services/orderService'

interface UseOrderDetailResult {
  order: Order | null
  isLoading: boolean
  error: string | null
}

export function useOrderDetail(orderId: string): UseOrderDetailResult {
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const orderData = await getOrderById(orderId)
        setOrder(orderData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la orden')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  return { order, isLoading, error }
}
