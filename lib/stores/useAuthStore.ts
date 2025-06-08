import { create } from "zustand"
import { auth } from "../firebase"
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth"
import { getUserById } from "../services/userService"
import type { User } from "../types"

interface AuthState {
  user: User | null
  firebaseUser: FirebaseUser | null
  isLoading: boolean
  error: string | null
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  checkAdminStatus: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  isLoading: true,
  error: null,
  isAdmin: false,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Get additional user data from Firestore
      const userData = await getUserById(firebaseUser.uid)

      if (!userData) {
        throw new Error("Usuario no encontrado en la base de datos")
      }

      // Check if user is admin
      const isAdmin = userData.role === "admin"

      if (!isAdmin) {
        await firebaseSignOut(auth)
        throw new Error("Acceso denegado. Solo administradores pueden acceder al panel.")
      }

      set({
        firebaseUser,
        user: userData,
        isLoading: false,
        isAdmin,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al iniciar sesión",
        isLoading: false,
      })
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth)
      set({ user: null, firebaseUser: null, isAdmin: false })
    } catch (error) {
      set({ error: "Error al cerrar sesión" })
    }
  },

  checkAdminStatus: async () => {
    const { firebaseUser } = get()
    if (!firebaseUser) return false

    try {
      const userData = await getUserById(firebaseUser.uid)
      const isAdmin = userData?.role === "admin"
      set({ isAdmin })
      return isAdmin
    } catch (error) {
      set({ error: "Error al verificar permisos de administrador" })
      return false
    }
  },
}))

// Initialize auth state listener
if (typeof window !== "undefined") {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userData = await getUserById(firebaseUser.uid)
      const isAdmin = userData?.role === "admin"

      useAuthStore.setState({
        firebaseUser,
        user: userData,
        isLoading: false,
        isAdmin,
      })
    } else {
      useAuthStore.setState({
        firebaseUser: null,
        user: null,
        isLoading: false,
        isAdmin: false,
      })
    }
  })
}
