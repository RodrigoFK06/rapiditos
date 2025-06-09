import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "../firebase"
import type { OrdersStats, TopDish, RidersStats, RestaurantsStats, Rider, Restaurant } from "../types"

export const getOrdersStats = async (): Promise<OrdersStats> => {
  try {
    const ordersSnapshot = await getDocs(collection(db, "orders"))
    const total = ordersSnapshot.size

    const completedSnapshot = await getDocs(
      query(collection(db, "orders"), where("estado", "==", "Completado"))
    )
    const completed = completedSnapshot.size

    const canceledSnapshot = await getDocs(
      query(collection(db, "orders"), where("estado", "==", "Cancelado"))
    )
    const canceled = canceledSnapshot.size

    const pendingSnapshot = await getDocs(
      query(
        collection(db, "orders"),
        where("estado", "in", ["Nuevo", "Preparando", "Enviando"])
      )
    )
    const pending = pendingSnapshot.size

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)
    const perDaySnapshot = await getDocs(
      query(collection(db, "orders"), where("fecha_creacion", ">=", sevenDaysAgo))
    )
    const perDayMap: Record<string, number> = {}
    perDaySnapshot.forEach((doc) => {
      const data = doc.data()
      const date = (data.fecha_creacion instanceof Timestamp
        ? data.fecha_creacion.toDate()
        : data.fecha_creacion) as Date
      const day = date.toISOString().slice(0, 10)
      perDayMap[day] = (perDayMap[day] || 0) + 1
    })
    const perDay = Object.entries(perDayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const paymentMap: Record<string, number> = {}
    ordersSnapshot.forEach((doc) => {
      const method = doc.data().metodo_pago || "Otro"
      paymentMap[method] = (paymentMap[method] || 0) + 1
    })
    const paymentMethods = Object.entries(paymentMap).map(([name, count]) => ({
      name,
      count,
    }))

    return { total, completed, pending, canceled, perDay, paymentMethods }
  } catch (error) {
    console.error("Error fetching orders stats:", error)
    return { total: 0, completed: 0, pending: 0, canceled: 0, perDay: [], paymentMethods: [] }
  }
}

export const getTopDishes = async (limit = 5): Promise<TopDish[]> => {
  try {
    const detailsSnapshot = await getDocs(collection(db, "orderdetails"))
    const dishMap: Record<string, { count: number; image?: string }> = {}
    detailsSnapshot.forEach((doc) => {
      const data = doc.data()
      const name = (data.nombre as string) || ""
      const count = (data.cantidad as number) || 1
      dishMap[name] = dishMap[name]
        ? { count: dishMap[name].count + count, image: dishMap[name].image || data.imagen }
        : { count, image: data.imagen }
    })
    return Object.entries(dishMap)
      .map(([name, { count, image }]) => ({ name, count, image }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  } catch (error) {
    console.error("Error fetching top dishes:", error)
    return []
  }
}

export const getRidersStats = async (): Promise<RidersStats> => {
  try {
    const ridersSnapshot = await getDocs(collection(db, "rider"))
    let totalActive = 0
    let totalDeliveries = 0
    const riders: RidersStats["topRiders"] = []
    ridersSnapshot.forEach((doc) => {
      const data = doc.data() as Rider
      if (data.active_rider) totalActive++
      totalDeliveries += data.number_deliverys || 0
      riders.push({
        id: doc.id,
        display_name: data.display_name,
        phone: data.phone,
        count: data.number_deliverys || 0,
      })
    })
    const topRiders = riders.sort((a, b) => b.count - a.count).slice(0, 5)
    return { totalActive, totalDeliveries, topRiders }
  } catch (error) {
    console.error("Error fetching riders stats:", error)
    return { totalActive: 0, totalDeliveries: 0, topRiders: [] }
  }
}

export const getRestaurantsStats = async (): Promise<RestaurantsStats> => {
  try {
    const restSnapshot = await getDocs(collection(db, "restaurant"))
    const restaurants: Restaurant[] = restSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Restaurant),
    }))
    const totalActive = restaurants.filter((r) => r.isActive).length

    const ordersSnapshot = await getDocs(collection(db, "orders"))
    const countMap: Record<string, number> = {}
    ordersSnapshot.forEach((doc) => {
      const restRef = doc.data().restaurantref
      if (restRef) {
        const id = restRef.id
        countMap[id] = (countMap[id] || 0) + 1
      }
    })
    const topRestaurants = restaurants
      .map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.restaurantPhone,
        count: countMap[r.id] || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return { totalActive, topRestaurants }
  } catch (error) {
    console.error("Error fetching restaurants stats:", error)
    return { totalActive: 0, topRestaurants: [] }
  }
}
