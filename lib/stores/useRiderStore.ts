import { create } from "zustand"
import {
  getAllRiders,
  getRiderById,
  updateRider,
  getActiveRiders,
  getAssignedOrdersByRider,
} from "../services/riderService"
import type { Rider, AssignedRider } from "../types"

interface RiderState {
  riders: Rider[]
  activeRiders: Rider[]
  currentRider: Rider | null
  assignedOrders: AssignedRider[]
  isLoading: boolean
  error: string | null
  fetchRiders: () => Promise<void>
  fetchActiveRiders: () => Promise<void>
  fetchRiderById: (id: string) => Promise<void>
  updateRiderData: (id: string, data: Partial<Rider>) => Promise<boolean>
  fetchAssignedOrders: (riderId: string) => Promise<void>
}

export const useRiderStore = create<RiderState>((set) => ({
  riders: [],
  activeRiders: [],
  currentRider: null,
  assignedOrders: [],
  isLoading: false,
  error: null,

  fetchRiders: async () => {
    set({ isLoading: true, error: null })
    try {
      const riders = await getAllRiders()
      set({ riders, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar repartidores",
        isLoading: false,
      })
    }
  },

  fetchActiveRiders: async () => {
    set({ isLoading: true, error: null })
    try {
      const activeRiders = await getActiveRiders()
      set({ activeRiders, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar repartidores activos",
        isLoading: false,
      })
    }
  },

  fetchRiderById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const rider = await getRiderById(id)
      set({ currentRider: rider, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar el repartidor",
        isLoading: false,
      })
    }
  },

  updateRiderData: async (id: string, data: Partial<Rider>) => {
    set({ isLoading: true, error: null })
    try {
      const success = await updateRider(id, data)
      if (success) {
        // Update local state
        set((state) => ({
          currentRider:
            state.currentRider && state.currentRider.id === id
              ? { ...state.currentRider, ...data }
              : state.currentRider,
          riders: state.riders.map((r) => (r.id === id ? { ...r, ...data } : r)),
          activeRiders:
            data.isActive !== undefined
              ? data.isActive
                ? [...state.activeRiders, state.riders.find((r) => r.id === id)!].filter(Boolean)
                : state.activeRiders.filter((r) => r.id !== id)
              : state.activeRiders,
        }))
      }
      set({ isLoading: false })
      return success
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al actualizar el repartidor",
        isLoading: false,
      })
      return false
    }
  },

  fetchAssignedOrders: async (riderId: string) => {
    set({ isLoading: true, error: null })
    try {
      const assignments = await getAssignedOrdersByRider(riderId)
      set({ assignedOrders: assignments, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar pedidos asignados",
        isLoading: false,
      })
    }
  },
}))
