import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { User } from '@/lib/types'
import { 
  getAllUsersSafe, 
  getUserByIdSafe, 
  getUsersByRoleSafe, 
  updateUserSafe, 
  toggleUserStatusSafe 
} from '@/lib/services/userServiceSafe'
import { errorHandler } from '@/lib/errors/AppError'
import { useToast } from '@/hooks/use-toast'

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  byRole: (role: string) => [...userKeys.all, 'role', role] as const,
}

// Hooks para Queries

/**
 * Hook para obtener todos los usuarios
 */
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: getAllUsersSafe,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para obtener un usuario por ID
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserByIdSafe(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para obtener usuarios por rol
 */
export function useUsersByRole(role: string) {
  return useQuery({
    queryKey: userKeys.byRole(role),
    queryFn: () => getUsersByRoleSafe(role),
    enabled: !!role,
    staleTime: 5 * 60 * 1000,
  })
}

// Hooks para Mutations

/**
 * Hook para actualizar un usuario
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      updateUserSafe(id, data),
    
    onSuccess: (_, { id, data }) => {
      // Actualizar el caché optimistamente
      queryClient.setQueryData(userKeys.detail(id), (oldData: User | undefined) => {
        if (oldData) {
          return { ...oldData, ...data }
        }
        return oldData
      })

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      if (data.role) {
        queryClient.invalidateQueries({ queryKey: userKeys.byRole(data.role) })
      }

      toast({
        title: "Éxito",
        description: "Usuario actualizado correctamente",
      })
    },

    onError: (error) => {
      const appError = errorHandler.handle(error)
      toast({
        title: "Error",
        description: appError.userMessage,
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook para cambiar el estado de un usuario
 */
export function useToggleUserStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleUserStatusSafe(id, isActive),
    
    onMutate: async ({ id, isActive }) => {
      // Cancelar queries que podrían sobrescribir la actualización optimista
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) })

      // Obtener el estado anterior
      const previousUser = queryClient.getQueryData<User>(userKeys.detail(id))

      // Actualización optimista
      queryClient.setQueryData(userKeys.detail(id), (old: User | undefined) => {
        if (old) {
          return { ...old, isActive }
        }
        return old
      })

      // Retornar contexto para rollback
      return { previousUser }
    },

    onError: (error, variables, context) => {
      // Rollback en caso de error
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(variables.id), context.previousUser)
      }

      const appError = errorHandler.handle(error)
      toast({
        title: "Error",
        description: appError.userMessage,
        variant: "destructive",
      })
    },

    onSuccess: (_, { id, isActive }) => {
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })

      toast({
        title: "Éxito",
        description: isActive ? "Usuario activado" : "Usuario desactivado",
      })
    },

    onSettled: (_, __, { id }) => {
      // Siempre refetch el detalle del usuario para asegurar consistencia
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
    },
  })
}

/**
 * Hook para prefetch de usuarios
 */
export function usePrefetchUser() {
  const queryClient = useQueryClient()

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: userKeys.detail(id),
      queryFn: () => getUserByIdSafe(id),
      staleTime: 5 * 60 * 1000,
    })
  }
}

/**
 * Hook para búsqueda de usuarios con debounce
 */
export function useUserSearch(searchTerm: string, debounceMs = 300) {
  return useQuery({
    queryKey: [...userKeys.lists(), 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return []
      
      const users = await getAllUsersSafe()
      return users.filter(user => 
        user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    },
    enabled: searchTerm.length >= 2, // Solo buscar con al menos 2 caracteres
    staleTime: 30 * 1000, // 30 segundos para búsquedas
  })
}

// Utilidades para invalidar caché
export const invalidateUserQueries = (queryClient: ReturnType<typeof useQueryClient>) => ({
  all: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  lists: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  detail: (id: string) => queryClient.invalidateQueries({ queryKey: userKeys.detail(id) }),
  byRole: (role: string) => queryClient.invalidateQueries({ queryKey: userKeys.byRole(role) }),
})
