import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "../firebase"
import type { DashboardStats, Order } from "../types"
import { ORDER_STATUS } from "../constants/status"

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get active orders
    const activeOrdersQuery = query(
      collection(db, "orders"),
      where("admin_view", "==", true),
      where("activo", "==", true),
      where("estado", "in", [
        ORDER_STATUS.NUEVO,
        ORDER_STATUS.PREPARANDO,
        ORDER_STATUS.ENVIANDO,
      ]),
    )
    const activeOrdersSnapshot = await getDocs(activeOrdersQuery)
    const activeOrders = activeOrdersSnapshot.size

    // Get connected riders (assuming riders with active_rider=true are connected)
    const connectedRidersQuery = query(collection(db, "rider"), where("active_rider", "==", true))
    const connectedRidersSnapshot = await getDocs(connectedRidersQuery)
    const connectedRiders = connectedRidersSnapshot.size

    // Get total revenue (from completed orders)
    const completedOrdersQuery = query(
      collection(db, "orders"),
      where("admin_view", "==", true),
      where("estado", "==", ORDER_STATUS.COMPLETADOS)
    )
    const completedOrdersSnapshot = await getDocs(completedOrdersQuery)
    const completedOrders = completedOrdersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order)
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0)

    // Get total orders
  const ordersSnapshot = await getDocs(query(collection(db, "orders"), where("admin_view", "==", true)))
    const totalOrders = ordersSnapshot.size

    // Get restaurant count
    const restaurantsSnapshot = await getDocs(collection(db, "restaurant"))
    const restaurantCount = restaurantsSnapshot.size

    // Get user count
  const usersSnapshot = await getDocs(collection(db, "users"))
    const userCount = usersSnapshot.size

    return {
      activeOrders,
      connectedRiders,
      totalRevenue,
      totalOrders,
      restaurantCount,
      userCount,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      activeOrders: 0,
      connectedRiders: 0,
      totalRevenue: 0,
      totalOrders: 0,
      restaurantCount: 0,
      userCount: 0,
    }
  }
}

export const getRecentOrders = async (limitCount = 5): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, "orders"),
      where("admin_view", "==", true),
      orderBy("fecha_creacion", "desc"),
      limit(limitCount)
    )
    const ordersSnapshot = await getDocs(q)
    return ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order)
  } catch (error) {
    console.error("Error fetching recent orders:", error)
    return []
  }
}
