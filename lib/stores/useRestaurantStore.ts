import { create } from "zustand"
import {
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  toggleRestaurantStatus,
  addDishToRestaurant,
} from "../services/restaurantService"
import type { Restaurant, Dish } from "../types"

interface RestaurantState {
  restaurants: Restaurant[]
  currentRestaurant: Restaurant | null
  isLoading: boolean
  error: string | null
  fetchRestaurants: () => Promise<void>
  fetchRestaurantById: (id: string) => Promise<void>
  updateRestaurantData: (id: string, data: Partial<Restaurant>) => Promise<boolean>
  toggleStatus: (id: string, isActive: boolean) => Promise<boolean>
  addDish: (restaurantId: string, dish: Dish) => Promise<boolean>
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
  restaurants: [],
  currentRestaurant: null,
  isLoading: false,
  error: null,

  fetchRestaurants: async () => {
    set({ isLoading: true, error: null })
    try {
      const restaurants = await getAllRestaurants()
      set({ restaurants, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar restaurantes",
        isLoading: false,
      })
    }
  },

  fetchRestaurantById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const restaurant = await getRestaurantById(id)
      set({ currentRestaurant: restaurant, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar el restaurante",
        isLoading: false,
      })
    }
  },

  updateRestaurantData: async (id: string, data: Partial<Restaurant>) => {
    set({ isLoading: true, error: null })
    try {
      const success = await updateRestaurant(id, data)
      if (success) {
        // Update local state
        set((state) => ({
          currentRestaurant:
            state.currentRestaurant && state.currentRestaurant.id === id
              ? { ...state.currentRestaurant, ...data }
              : state.currentRestaurant,
          restaurants: state.restaurants.map((r) => (r.id === id ? { ...r, ...data } : r)),
        }))
      }
      set({ isLoading: false })
      return success
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al actualizar el restaurante",
        isLoading: false,
      })
      return false
    }
  },

  toggleStatus: async (id: string, isActive: boolean) => {
    set({ isLoading: true, error: null })
    try {
      const success = await toggleRestaurantStatus(id, isActive)
      if (success) {
        // Update local state
        set((state) => ({
          currentRestaurant:
            state.currentRestaurant && state.currentRestaurant.id === id
              ? { ...state.currentRestaurant, isActive }
              : state.currentRestaurant,
          restaurants: state.restaurants.map((r) => (r.id === id ? { ...r, isActive } : r)),
        }))
      }
      set({ isLoading: false })
      return success
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cambiar el estado del restaurante",
        isLoading: false,
      })
      return false
    }
  },

  addDish: async (restaurantId: string, dish: Dish) => {
    set({ isLoading: true, error: null })
    try {
      const success = await addDishToRestaurant(restaurantId, dish)
      if (success && dish) {
        // Update local state
        set((state) => {
          const currentRestaurant = state.currentRestaurant
          if (currentRestaurant && currentRestaurant.id === restaurantId) {
            const updatedPlatillos = [...(currentRestaurant.platillos || []), dish]
            return {
              currentRestaurant: {
                ...currentRestaurant,
                platillos: updatedPlatillos,
              },
            }
          }
          return state
        })
      }
      set({ isLoading: false })
      return success
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al añadir platillo",
        isLoading: false,
      })
      return false
    }
  },
}))
