import { create } from "zustand"
import { getDashboardStats, getRecentOrders } from "../services/dashboardService"
import type { DashboardStats, Order } from "../types"

interface DashboardState {
  stats: DashboardStats
  recentOrders: Order[]
  isLoading: boolean
  error: string | null
  fetchStats: () => Promise<void>
  fetchRecentOrders: (limit?: number) => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: {
    activeOrders: 0,
    connectedRiders: 0,
    totalRevenue: 0,
    totalOrders: 0,
    restaurantCount: 0,
    userCount: 0,
  },
  recentOrders: [],
  isLoading: false,
  error: null,

  fetchStats: async () => {
    set({ isLoading: true, error: null })
    try {
      const stats = await getDashboardStats()
      set({ stats, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar estadísticas",
        isLoading: false,
      })
    }
  },

  fetchRecentOrders: async (limit = 5) => {
    set({ isLoading: true, error: null })
    try {
      const orders = await getRecentOrders(limit)
      set({ recentOrders: orders, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar pedidos recientes",
        isLoading: false,
      })
    }
  },
}))
