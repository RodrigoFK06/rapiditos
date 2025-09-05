import { create } from "zustand"
import {
  getAllOrders,
  getActiveOrders,
  getOrderById,
  updateOrderStatus,
  getOrderDetails,
  assignRiderTransactional,
  completeOrderTransactional,
} from "../services/orderService"
import type { Order, OrderDetail, OrderStatus } from "../types"
import { subscribeOrderById } from "../services/orderService"
import { ORDER_STATUS } from "../constants/status"

interface OrderState {
  orders: Order[]
  activeOrders: Order[]
  currentOrder: Order | null
  orderDetails: OrderDetail[]
  isLoading: boolean
  error: string | null
  fetchOrders: () => Promise<void>
  fetchActiveOrders: () => Promise<void>
  fetchOrderById: (id: string) => Promise<void>
  updateStatus: (id: string, status: OrderStatus) => Promise<boolean>
  assignRider: (orderId: string, riderId: string) => Promise<boolean>
  fetchOrderDetails: (orderId: string) => Promise<void>
  listenToOrder: (orderId: string) => (() => void) | undefined
  stopListeningOrder: () => void
}

let orderUnsubscribe: (() => void) | null = null

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  activeOrders: [],
  currentOrder: null,
  orderDetails: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null })
    try {
      const orders = await getAllOrders()
      set({ orders, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar pedidos",
        isLoading: false,
      })
    }
  },

  fetchActiveOrders: async () => {
    set({ isLoading: true, error: null })
    try {
      const activeOrders = await getActiveOrders()
      set({ activeOrders, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar pedidos activos",
        isLoading: false,
      })
    }
  },

  fetchOrderById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const order = await getOrderById(id)
      set({ currentOrder: order, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar el pedido",
        isLoading: false,
      })
    }
  },

  updateStatus: async (id: string, status: OrderStatus) => {
    console.log("[Store] updateStatus called with:", { orderId: id, nextStatus: status })
    set({ isLoading: true, error: null })
    try {
      let success = false
      if (status === ORDER_STATUS.COMPLETADOS) {
        await completeOrderTransactional(id)
        success = true
      } else {
        success = await updateOrderStatus(id, status)
      }
      // Si hay suscripción activa, no forzamos setState; el snapshot llegará.
      if (success && !orderUnsubscribe) {
        await getOrderById(id).then((order) => {
          set((state) => ({
            currentOrder: order,
            orders: state.orders.map((o) => (o.id === id ? { ...o, estado: status } : o)),
            activeOrders:
              status === ORDER_STATUS.COMPLETADOS
                ? state.activeOrders.filter((o) => o.id !== id)
                : state.activeOrders.map((o) => (o.id === id ? { ...o, estado: status } : o)),
          }))
        })
      }
      set({ isLoading: false })
      return success
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al actualizar el estado del pedido",
        isLoading: false,
      })
      return false
    }
  },

  assignRider: async (orderId: string, riderId: string) => {
    console.log("[Store] assignRider called with:", { orderId, riderId })
    set({ isLoading: true, error: null })
    try {
      // Usar transaccional con ruta de referencia completa
      await assignRiderTransactional(orderId, `/rider/${riderId}`)
      // Si no hay suscripción, refrescar una vez
      if (!orderUnsubscribe) {
        await getOrderById(orderId).then((order) => {
          set((state) => ({
            currentOrder: order,
            orders: state.orders.map((o) => (o.id === orderId ? { ...o, asigned: true } : o)),
            activeOrders: state.activeOrders.map((o) => (o.id === orderId ? { ...o, asigned: true } : o)),
          }))
        })
      }
      set({ isLoading: false })
      return true
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al asignar repartidor",
        isLoading: false,
      })
      return false
    }
  },

  fetchOrderDetails: async (orderId: string) => {
    set({ isLoading: true, error: null })
    try {
      const details = await getOrderDetails(orderId)
      set({ orderDetails: details, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar detalles del pedido",
        isLoading: false,
      })
    }
  },

  listenToOrder: (orderId: string) => {
    try {
      if (orderUnsubscribe) {
        orderUnsubscribe()
        orderUnsubscribe = null
      }
  orderUnsubscribe = subscribeOrderById(orderId, (order: Order | null) => {
        set({ currentOrder: order })
      })
      return orderUnsubscribe ?? undefined
    } catch (e) {
      console.error("[Store] listenToOrder ERROR", e)
      return undefined
    }
  },
  stopListeningOrder: () => {
    try {
      if (orderUnsubscribe) {
        orderUnsubscribe()
        orderUnsubscribe = null
      }
    } catch (e) {
      console.error("[Store] stopListeningOrder ERROR", e)
    }
  },
}))
