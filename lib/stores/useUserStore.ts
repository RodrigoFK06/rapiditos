import { create } from "zustand"
import { getAllUsers, getUserById, updateUser, toggleUserStatus, getUsersByRole } from "../services/userService"
import type { User } from "../types"

interface UserState {
  users: User[]
  clients: User[]
  restaurantUsers: User[]
  riderUsers: User[]
  currentUser: User | null
  isLoading: boolean
  error: string | null
  fetchUsers: () => Promise<void>
  fetchUsersByRole: (role: string) => Promise<void>
  fetchUserById: (id: string) => Promise<void>
  updateUserData: (id: string, data: Partial<User>) => Promise<boolean>
  toggleStatus: (id: string, isActive: boolean) => Promise<boolean>
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  clients: [],
  restaurantUsers: [],
  riderUsers: [],
  currentUser: null,
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null })
    try {
      const users = await getAllUsers()
      set({
        users,
        clients: users.filter((user) => user.role === "client"),
        restaurantUsers: users.filter((user) => user.role === "restaurant"),
        riderUsers: users.filter((user) => user.role === "rider"),
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar usuarios",
        isLoading: false,
      })
    }
  },

  fetchUsersByRole: async (role: string) => {
    set({ isLoading: true, error: null })
    try {
      const users = await getUsersByRole(role)

      // Update the appropriate state based on role
      if (role === "client") {
        set({ clients: users, isLoading: false })
      } else if (role === "restaurant") {
        set({ restaurantUsers: users, isLoading: false })
      } else if (role === "rider") {
        set({ riderUsers: users, isLoading: false })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : `Error al cargar usuarios de tipo ${role}`,
        isLoading: false,
      })
    }
  },

  fetchUserById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const user = await getUserById(id)
      set({ currentUser: user, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar el usuario",
        isLoading: false,
      })
    }
  },

  updateUserData: async (id: string, data: Partial<User>) => {
    set({ isLoading: true, error: null })
    try {
      const success = await updateUser(id, data)
      if (success) {
        // Update local state
        set((state) => ({
          currentUser:
            state.currentUser && state.currentUser.uid === id ? { ...state.currentUser, ...data } : state.currentUser,
          users: state.users.map((u) => (u.uid === id ? { ...u, ...data } : u)),
          clients: state.clients.map((u) => (u.uid === id ? { ...u, ...data } : u)),
          restaurantUsers: state.restaurantUsers.map((u) => (u.uid === id ? { ...u, ...data } : u)),
          riderUsers: state.riderUsers.map((u) => (u.uid === id ? { ...u, ...data } : u)),
        }))
      }
      set({ isLoading: false })
      return success
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al actualizar el usuario",
        isLoading: false,
      })
      return false
    }
  },

  toggleStatus: async (id: string, isActive: boolean) => {
    set({ isLoading: true, error: null })
    try {
      const success = await toggleUserStatus(id, isActive)
      if (success) {
        // Update local state
        set((state) => ({
          currentUser:
            state.currentUser && state.currentUser.uid === id ? { ...state.currentUser, isActive } : state.currentUser,
          users: state.users.map((u) => (u.uid === id ? { ...u, isActive } : u)),
          clients: state.clients.map((u) => (u.uid === id ? { ...u, isActive } : u)),
          restaurantUsers: state.restaurantUsers.map((u) => (u.uid === id ? { ...u, isActive } : u)),
          riderUsers: state.riderUsers.map((u) => (u.uid === id ? { ...u, isActive } : u)),
        }))
      }
      set({ isLoading: false })
      return success
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cambiar el estado del usuario",
        isLoading: false,
      })
      return false
    }
  },
}))
