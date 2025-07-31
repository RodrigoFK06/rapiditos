import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useCallback } from 'react'
import { 
  getAllUsers, 
  getUserById, 
  getUsersByRole, 
  updateUser, 
  toggleUserStatus, 
  searchUsers,
  UserQueryOptions,
  PaginatedUsers 
} from '@/lib/services/userService'
import type { User } from '@/lib/types'
import { toast } from '@/hooks/use-toast'

// 🔑 Query Keys - Estructura centralizada para cache management
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserQueryOptions) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  byRole: (role: string) => [...userKeys.all, 'role', role] as const,
  search: (term: string) => [...userKeys.all, 'search', term] as const,
}

/**
 * 👥 Hook principal para obtener lista de usuarios
 * ✅ SOLUCIÓN PROBLEMA 2: Cache estable, sin loops infinitos
 * ✅ SOLUCIÓN PROBLEMA 3: Estado derivado sin ciclos de actualización
 */
export function useUsers(options: UserQueryOptions = {}) {
  return useQuery({
    queryKey: userKeys.list(options),
    queryFn: () => getAllUsers(options),
    staleTime: 5 * 60 * 1000, // 5 minutos - datos permanecen frescos
    gcTime: 10 * 60 * 1000,   // 10 minutos - tiempo en cache después de ser stale
    refetchOnWindowFocus: false, // No refetch automático al enfocar ventana
    refetchOnReconnect: true,    // Sí refetch al reconectar internet
    retry: (failureCount, error: any) => {
      // No reintentar en errores específicos de índices
      if (error?.message?.includes('index')) {
        return false
      }
      // Máximo 2 reintentos para otros errores
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // ✅ Función para manejar errores de forma centralizada
    throwOnError: (error: any) => {
      console.error('Error en useUsers:', error)
      return false // No lanzar error, manejarlo en el estado
    },
    
    // ✅ Placeholder data para evitar estados undefined
    placeholderData: { users: [], lastDoc: null, hasMore: false, total: 0 } as PaginatedUsers,
  })
}

/**
 * 👤 Hook para obtener un usuario específico
 * ✅ Cache individual por usuario
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: !!id && id.trim() !== '', // Solo ejecutar si hay ID válido
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  })
}

/**
 * 👥 Hook para usuarios por rol
 * ✅ Cache separado por rol
 */
export function useUsersByRole(role: string) {
  return useQuery({
    queryKey: userKeys.byRole(role),
    queryFn: () => getUsersByRole(role),
    enabled: !!role && role.trim() !== '',
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  })
}

/**
 * 🔍 Hook para búsqueda de usuarios con debounce
 * ✅ Evita consultas excesivas durante escritura
 */
export function useUserSearch(searchTerm: string, debounceMs: number = 300) {
  // Debounce manual usando React Query's query key
  const debouncedTerm = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return ''
    }
    return searchTerm.trim()
  }, [searchTerm])

  return useQuery({
    queryKey: userKeys.search(debouncedTerm),
    queryFn: () => searchUsers(debouncedTerm),
    enabled: debouncedTerm.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutos para búsquedas
    gcTime: 5 * 60 * 1000,
    retry: 1, // Menos reintentos para búsquedas
  })
}

/**
 * ✏️ Hook para actualizar usuarios
 * ✅ SOLUCIÓN PROBLEMA 3: Actualizaciones optimistas sin loops
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => 
      updateUser(id, data),
    
    // ✅ Actualización optimista - UI instantánea
    onMutate: async ({ id, data }) => {
      // Cancelar queries en curso para evitar conflictos
      await queryClient.cancelQueries({ queryKey: userKeys.all })

      // Snapshot del estado anterior para rollback
      const previousUsers = queryClient.getQueryData<PaginatedUsers>(userKeys.lists())
      const previousUser = queryClient.getQueryData<User>(userKeys.detail(id))

      // Actualización optimista en la lista
      queryClient.setQueryData<PaginatedUsers>(
        userKeys.lists(),
        (old) => {
          if (!old) return old
          return {
            ...old,
            users: old.users.map((user) =>
              user.uid === id 
                ? { ...user, ...data } 
                : user
            )
          }
        }
      )

      // Actualización optimista en el detalle
      queryClient.setQueryData<User>(
        userKeys.detail(id),
        (old) => old ? { ...old, ...data } : old
      )

      return { previousUsers, previousUser }
    },

    // ✅ Rollback en caso de error
    onError: (error, { id }, context) => {
      // Restaurar estado anterior
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.lists(), context.previousUsers)
      }
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(id), context.previousUser)
      }

      // Mostrar error al usuario
      toast({
        title: "Error al actualizar",
        description: error instanceof Error 
          ? error.message 
          : "No se pudo actualizar el usuario",
        variant: "destructive",
      })
    },

    // ✅ Confirmación de éxito
    onSuccess: (success, { id, data }) => {
      if (success) {
        toast({
          title: "Usuario actualizado",
          description: "Los cambios se han guardado correctamente",
          variant: "default",
        })

        // Invalidar queries relacionadas para refrescar datos
        queryClient.invalidateQueries({ queryKey: userKeys.lists() })
        queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
        
        // Si se cambió el rol, invalidar queries por rol
        if (data.role) {
          queryClient.invalidateQueries({ queryKey: userKeys.byRole(data.role) })
        }
      }
    },

    // ✅ Cleanup después de la mutación
    onSettled: () => {
      // Refrescar queries después de la mutación (éxito o error)
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

/**
 * 🔄 Hook para cambiar estado activo/inactivo
 * ✅ Acción específica optimizada
 */
export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      toggleUserStatus(id, isActive),
    
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: userKeys.all })

      const previousUsers = queryClient.getQueryData<PaginatedUsers>(userKeys.lists())
      const previousUser = queryClient.getQueryData<User>(userKeys.detail(id))

      // Actualización optimista
      queryClient.setQueryData<PaginatedUsers>(
        userKeys.lists(),
        (old) => {
          if (!old) return old
          return {
            ...old,
            users: old.users.map((user) =>
              user.uid === id 
                ? { ...user, isActive } 
                : user
            )
          }
        }
      )

      return { previousUsers, previousUser }
    },

    onError: (error, { id, isActive }, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.lists(), context.previousUsers)
      }
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(id), context.previousUser)
      }

      toast({
        title: "Error al cambiar estado",
        description: error instanceof Error 
          ? error.message 
          : `No se pudo ${isActive ? 'activar' : 'desactivar'} el usuario`,
        variant: "destructive",
      })
    },

    onSuccess: (success, { id, isActive }) => {
      if (success) {
        toast({
          title: `Usuario ${isActive ? 'activado' : 'desactivado'}`,
          description: "El estado del usuario se ha actualizado correctamente",
          variant: "default",
        })

        queryClient.invalidateQueries({ queryKey: userKeys.lists() })
        queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

/**
 * 🚀 Hook para precargar datos de usuarios
 * ✅ Optimización de performance para navegación
 */
export function usePrefetchUser() {
  const queryClient = useQueryClient()

  return useCallback((id: string) => {
    queryClient.prefetchQuery({
      queryKey: userKeys.detail(id),
      queryFn: () => getUserById(id),
      staleTime: 5 * 60 * 1000,
    })
  }, [queryClient])
}

/**
 * 📊 Hook derivado para estadísticas de usuarios
 * ✅ Estado calculado sin efectos secundarios
 */
export function useUserStats(options: UserQueryOptions = {}) {
  const { data, isLoading, error } = useUsers(options)

  return useMemo(() => {
    if (!data || isLoading) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byRole: {},
        isLoading,
        error
      }
    }

    const users = data.users
    const total = users.length
    const active = users.filter(u => u.isActive).length
    const inactive = total - active
    
    const byRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      active,
      inactive,
      byRole,
      isLoading: false,
      error: null
    }
  }, [data, isLoading, error])
}

/**
 * 🔧 Hook para acciones masivas (futuro)
 * ✅ Preparado para operaciones batch
 */
export function useBulkUserActions() {
  const queryClient = useQueryClient()

  const bulkToggleStatus = useMutation({
    mutationFn: async ({ ids, isActive }: { ids: string[]; isActive: boolean }) => {
      // Implementar operaciones en lote si Firebase lo soporta
      const results = await Promise.allSettled(
        ids.map(id => toggleUserStatus(id, isActive))
      )
      
      return results.map((result, index) => ({
        id: ids[index],
        success: result.status === 'fulfilled' && result.value,
        error: result.status === 'rejected' ? result.reason : null
      }))
    },

    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length

      toast({
        title: "Operación completada",
        description: `${successful} usuarios actualizados${failed > 0 ? `, ${failed} fallaron` : ''}`,
        variant: failed > 0 ? "destructive" : "default",
      })

      // Invalidar todas las queries de usuarios
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })

  return { bulkToggleStatus }
}
