import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { User } from '@/lib/types'
import { getAllUsers, updateUser, toggleUserStatus } from '@/lib/services/userService'

// Slice para usuarios generales
interface UserSlice {
  users: User[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchUsers: () => Promise<void>
  updateUser: (id: string, data: Partial<User>) => Promise<boolean>
  toggleStatus: (id: string, isActive: boolean) => Promise<boolean>
  
  // Selectors (computed values)
  getUserById: (id: string) => User | undefined
  getUsersByRole: (role: string) => User[]
}

export const useUserSlice = create<UserSlice>()(
  subscribeWithSelector(
    immer((set, get) => ({
      users: [],
      isLoading: false,
      error: null,

      fetchUsers: async () => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })
        
        try {
          const users = await getAllUsers()
          set((state) => {
            state.users = users
            state.isLoading = false
          })
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error al cargar usuarios'
            state.isLoading = false
          })
        }
      },

      updateUser: async (id: string, data: Partial<User>) => {
        try {
          const success = await updateUser(id, data)
          if (success) {
            set((state) => {
              const userIndex = state.users.findIndex(u => u.uid === id)
              if (userIndex !== -1) {
                state.users[userIndex] = { ...state.users[userIndex], ...data }
              }
            })
          }
          return success
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error al actualizar usuario'
          })
          return false
        }
      },

      toggleStatus: async (id: string, isActive: boolean) => {
        try {
          const success = await toggleUserStatus(id, isActive)
          if (success) {
            set((state) => {
              const userIndex = state.users.findIndex(u => u.uid === id)
              if (userIndex !== -1) {
                state.users[userIndex].isActive = isActive
              }
            })
          }
          return success
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error al cambiar estado'
          })
          return false
        }
      },

      // Computed selectors - No causan re-renders si el valor no cambia
      getUserById: (id: string) => {
        return get().users.find(u => u.uid === id)
      },

      getUsersByRole: (role: string) => {
        return get().users.filter(u => u.role === role)
      }
    }))
  )
)

// Selectores especializados para evitar re-renders
export const useUsers = () => useUserSlice(state => state.users)
export const useUsersLoading = () => useUserSlice(state => state.isLoading)
export const useUsersError = () => useUserSlice(state => state.error)
export const useUserActions = () => useUserSlice(state => ({
  fetchUsers: state.fetchUsers,
  updateUser: state.updateUser,
  toggleStatus: state.toggleStatus
}))

// Selector con parámetro
export const useUserById = (id: string) => 
  useUserSlice(state => state.users.find(u => u.uid === id))

export const useUsersByRole = (role: string) => 
  useUserSlice(state => state.users.filter(u => u.role === role))
