import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ExchangeRate } from '@/lib/types'
import { 
  getAllExchangeRates, 
  updateExchangeRate,
  getExchangeRateById 
} from '@/lib/services/exchangeRateService'
import { toast } from '@/hooks/use-toast'

// Query keys for exchange rates
export const exchangeRateKeys = {
  all: ['exchangeRates'] as const,
  lists: () => [...exchangeRateKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...exchangeRateKeys.lists(), { filters }] as const,
  details: () => [...exchangeRateKeys.all, 'detail'] as const,
  detail: (id: string) => [...exchangeRateKeys.details(), id] as const,
}

/**
 * Hook para obtener todas las tasas de cambio
 */
export function useExchangeRates() {
  return useQuery({
    queryKey: exchangeRateKeys.lists(),
    queryFn: getAllExchangeRates,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // No reintentar en errores 4xx
      if (error?.status >= 400 && error?.status < 500) {
        return false
      }
      return failureCount < 2
    },
  })
}

/**
 * Hook para obtener una tasa de cambio específica por ID
 */
export function useExchangeRate(id: string) {
  return useQuery({
    queryKey: exchangeRateKeys.detail(id),
    queryFn: () => getExchangeRateById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook para actualizar una tasa de cambio
 */
export function useUpdateExchangeRate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number }) => 
      updateExchangeRate(id, rate),
    
    onMutate: async ({ id, rate }) => {
      // Cancelar queries en curso para evitar conflictos
      await queryClient.cancelQueries({ queryKey: exchangeRateKeys.all })

      // Snapshot del estado anterior para rollback
      const previousExchangeRates = queryClient.getQueryData<ExchangeRate[]>(
        exchangeRateKeys.lists()
      )

      // Actualización optimista
      queryClient.setQueryData<ExchangeRate[]>(
        exchangeRateKeys.lists(),
        (old) => 
          old?.map((exchangeRate) =>
            exchangeRate.id === id ? { ...exchangeRate, rate } : exchangeRate
          ) || []
      )

      // También actualizar el detalle específico si existe
      queryClient.setQueryData<ExchangeRate | null>(
        exchangeRateKeys.detail(id),
        (old) => old ? { ...old, rate } : null
      )

      return { previousExchangeRates }
    },

    onError: (error, variables, context) => {
      // Rollback en caso de error
      if (context?.previousExchangeRates) {
        queryClient.setQueryData(
          exchangeRateKeys.lists(),
          context.previousExchangeRates
        )
      }

      // Mostrar error al usuario
      toast({
        title: "Error al actualizar",
        description: error instanceof Error 
          ? error.message 
          : "No se pudo actualizar la tasa de cambio",
        variant: "destructive",
      })
    },

    onSuccess: (success, { id, rate }) => {
      if (success) {
        toast({
          title: "Tasa actualizada",
          description: `La tasa se actualizó correctamente a ${rate.toFixed(4)}`,
          variant: "default",
        })

        // Invalidar queries para refrescar datos
        queryClient.invalidateQueries({ 
          queryKey: exchangeRateKeys.lists() 
        })
        queryClient.invalidateQueries({ 
          queryKey: exchangeRateKeys.detail(id) 
        })
      }
    },

    onSettled: () => {
      // Refrescar queries después de la mutación
      queryClient.invalidateQueries({ 
        queryKey: exchangeRateKeys.all 
      })
    },
  })
}

/**
 * Hook para pre-cargar datos de exchange rates
 */
export function usePrefetchExchangeRate() {
  const queryClient = useQueryClient()

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: exchangeRateKeys.detail(id),
      queryFn: () => getExchangeRateById(id),
      staleTime: 5 * 60 * 1000,
    })
  }
}
