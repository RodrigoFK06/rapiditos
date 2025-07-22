import { useQuery } from '@tanstack/react-query'
import { User } from '@/lib/types'
import { getUserByRef } from '@/lib/services/userService'

interface UseUserDetailResult {
  user: User | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * 🔧 Hook para obtener detalle de usuario con React Query
 * ✅ SOLUCIÓN PROBLEMA 2 & 3: Evita loops infinitos y maximum update depth
 * ✅ Cache automático y revalidación inteligente
 * ✅ Estados derivados estables sin efectos secundarios
 */
export function useUserDetail(refId: string): UseUserDetailResult {
  const {
    data: user = null,
    isLoading,
    error,
    refetch
  } = useQuery({
    // ✅ Query key estable - previene re-renders innecesarios
    queryKey: ['user-detail', refId],
    
    // ✅ Query function memoizada automáticamente por React Query
    queryFn: async () => {
      if (!refId || refId.trim() === '') {
        return null
      }
      
      try {
        return await getUserByRef(refId)
      } catch (err) {
        // ✅ Error handling centralizado
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar usuario'
        console.error('Error fetching user detail:', err)
        throw new Error(errorMessage)
      }
    },
    
    // ✅ Configuración para evitar consultas innecesarias
    enabled: Boolean(refId && refId.trim() !== ''), // Solo ejecutar si hay refId válido
    staleTime: 5 * 60 * 1000,     // 5 minutos - datos frescos
    gcTime: 10 * 60 * 1000,       // 10 minutos - tiempo en cache
    refetchOnWindowFocus: false,   // No refetch al enfocar ventana
    refetchOnReconnect: true,      // Sí refetch al reconectar
    retry: 2,                      // Máximo 2 reintentos
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // ✅ Placeholder data para evitar null/undefined inconsistentes
    placeholderData: null,
  })

  return {
    user,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: () => {
      refetch()
    }
  }
}
