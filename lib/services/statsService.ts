import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  getCountFromServer,
  limit,
  orderBy
} from "firebase/firestore"
import { startOfDay, startOfWeek, startOfMonth, subDays, format } from "date-fns"
import { db } from "../firebase"
import type {
  OrdersStats,
  TopDish,
  RidersStats,
  RestaurantsStats,
  Rider,
  Restaurant,
  DashboardKpis,
  TimeStats,
  Order,
  OrderDetail,
} from "../types"

export const getDashboardKpis = async (): Promise<DashboardKpis> => {
  try {
    const today = startOfDay(new Date())
    const week = startOfWeek(new Date(), { weekStartsOn: 1 })
    const month = startOfMonth(new Date())

    // Consultas paralelas optimizadas con filtros
    const [
      completedTodaySnapshot,
      completedWeekSnapshot,
      completedMonthSnapshot,
      newUsersSnapshot,
      activeOrdersCount,
      recentDeliveredOrders
    ] = await Promise.all([
      // Órdenes completadas hoy
      getDocs(query(
        collection(db, "orders"),
        where("estado", "==", "Completado"),
        where("fecha_creacion", ">=", Timestamp.fromDate(today))
      )),
      
      // Órdenes completadas esta semana
      getDocs(query(
        collection(db, "orders"),
        where("estado", "==", "Completado"),
        where("fecha_creacion", ">=", Timestamp.fromDate(week))
      )),
      
      // Órdenes completadas este mes
      getDocs(query(
        collection(db, "orders"),
        where("estado", "==", "Completado"),
        where("fecha_creacion", ">=", Timestamp.fromDate(month))
      )),
      
      // Nuevos usuarios hoy
      getCountFromServer(query(
        collection(db, "users"),
        where("createdAt", ">=", Timestamp.fromDate(today))
      )),
      
      // Órdenes activas
      getCountFromServer(query(
        collection(db, "orders"),
        where("activo", "==", true),
        where("estado", "in", ["Nuevo", "Preparando", "Enviando"])
      )),
      
      // Órdenes entregadas recientes para calcular tiempo promedio
      getDocs(query(
        collection(db, "orders"),
        where("estado", "==", "Completado"),
        where("fecha_creacion", ">=", Timestamp.fromDate(subDays(new Date(), 7))),
        limit(100)
      ))
    ])

    // Calcular ingresos
    const incomeToday = completedTodaySnapshot.docs.reduce((sum, doc) => {
      const data = doc.data()
      return sum + (data.total || 0)
    }, 0)

    const incomeWeek = completedWeekSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data()
      return sum + (data.total || 0)
    }, 0)

    const incomeMonth = completedMonthSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data()
      return sum + (data.total || 0)
    }, 0)

    // Calcular tiempo promedio de entrega
    let avgDeliveryMinutes = 0
    if (recentDeliveredOrders.docs.length > 0) {
      const totalMinutes = recentDeliveredOrders.docs.reduce((sum, doc) => {
        const data = doc.data()
        if (data.fecha_entrega && data.fecha_creacion) {
          const deliveryTime = data.fecha_entrega instanceof Timestamp 
            ? data.fecha_entrega.toDate() 
            : new Date(data.fecha_entrega)
          const orderTime = data.fecha_creacion instanceof Timestamp 
            ? data.fecha_creacion.toDate() 
            : new Date(data.fecha_creacion)
          const diffMinutes = (deliveryTime.getTime() - orderTime.getTime()) / (1000 * 60)
          return sum + diffMinutes
        }
        return sum
      }, 0)
      avgDeliveryMinutes = totalMinutes / recentDeliveredOrders.docs.length
    }

    const newUsersToday = newUsersSnapshot.data().count
    const conversionRate = newUsersToday > 0 ? completedTodaySnapshot.docs.length / newUsersToday : 0

    return {
      incomeToday,
      incomeWeek,
      incomeMonth,
      newUsersToday,
      conversionRate,
      avgDeliveryMinutes,
    }
  } catch (error) {
    console.error("Error fetching KPIs:", error)
    return {
      incomeToday: 0,
      incomeWeek: 0,
      incomeMonth: 0,
      newUsersToday: 0,
      conversionRate: 0,
      avgDeliveryMinutes: 0,
    }
  }
}

export const getOrdersStats = async (): Promise<OrdersStats> => {
  try {
    const ordersSnapshot = await getDocs(collection(db, "orders"))
    let total = 0
    let completed = 0
    let canceled = 0
    let pending = 0
    let revenue = 0
    const paymentMap: Record<string, number> = {}
    const perDay7: Record<string, number> = {}
    const perDay30: Record<string, number> = {}
    const start7 = subDays(startOfDay(new Date()), 6)
    const start30 = subDays(startOfDay(new Date()), 29)

    ordersSnapshot.forEach((doc) => {
      const data = doc.data() as Order
      total++
      const created = (data.fecha_creacion instanceof Timestamp
        ? data.fecha_creacion.toDate()
        : data.fecha_creacion) as Date
      const day = format(created, "yyyy-MM-dd")
      if (created >= start7) perDay7[day] = (perDay7[day] || 0) + 1
      if (created >= start30) perDay30[day] = (perDay30[day] || 0) + 1

      const method = data.metodo_pago || "Otro"
      paymentMap[method] = (paymentMap[method] || 0) + 1

      switch (data.estado) {
        case "Completados":
          completed++
          revenue += data.total || 0
          break
        case "Cancelado":
          canceled++
          break
        default:
          pending++
      }
    })

    const perDay = Object.entries(perDay7)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
    const perDay30Arr = Object.entries(perDay30)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
    const paymentMethods = Object.entries(paymentMap).map(([name, count]) => ({
      name,
      count,
    }))
    const completionRate = total ? completed / total : 0

    return {
      total,
      completed,
      pending,
      canceled,
      totalRevenue: revenue,
      completionRate,
      perDay,
      perDay30: perDay30Arr,
      paymentMethods,
    }
  } catch (error) {
    console.error("Error fetching orders stats:", error)
    return {
      total: 0,
      completed: 0,
      pending: 0,
      canceled: 0,
      totalRevenue: 0,
      completionRate: 0,
      perDay: [],
      perDay30: [],
      paymentMethods: [],
    }
  }
}

export const getTopDishes = async (limit = 5): Promise<TopDish[]> => {
  try {
    const detailsSnapshot = await getDocs(collection(db, "orderdetails"))
    const dishMap: Record<string, { count: number; revenue: number; image?: string }> = {}
    detailsSnapshot.forEach((doc) => {
      const data = doc.data() as OrderDetail
      const name = (data.nombre as string) || ""
      const count = (data.cantidad as number) || 1
      const subtotal = data.subtotal || count * (data.precio_unitario || 0)
      dishMap[name] = dishMap[name]
        ? {
            count: dishMap[name].count + count,
            revenue: dishMap[name].revenue + subtotal,
            image: dishMap[name].image || data.imagen,
          }
        : { count, revenue: subtotal, image: data.imagen }
    })
    return Object.entries(dishMap)
      .map(([name, { count, revenue, image }]) => ({ name, count, revenue, image }))
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
    const restaurants: Restaurant[] = restSnapshot.docs.map((doc) => {
      const data = doc.data() as Restaurant
      return {
        ...data,
        id: doc.id, // Asegurar que el id del documento prevalezca
      }
    })
    const totalActive = restaurants.filter((r) => r.isActive).length

    const ordersSnapshot = await getDocs(collection(db, "orders"))
    const countMap: Record<string, { orders: number; revenue: number }> = {}
    ordersSnapshot.forEach((doc) => {
      const data = doc.data() as Order
      const restRef = data.restaurantref
      if (restRef) {
        const id = restRef.id
        if (!countMap[id]) countMap[id] = { orders: 0, revenue: 0 }
        countMap[id].orders++
        if (data.estado === "Completados") {
          countMap[id].revenue += data.total || 0
        }
      }
    })

    const detailsSnapshot = await getDocs(collection(db, "orderdetails"))
    const dishMap: Record<string, Record<string, number>> = {}
    detailsSnapshot.forEach((doc) => {
      const data = doc.data() as OrderDetail
      const restId = data.restaurantref?.id
      if (!restId) return
      const name = data.nombre
      const count = data.cantidad
      if (!dishMap[restId]) dishMap[restId] = {}
      dishMap[restId][name] = (dishMap[restId][name] || 0) + count
    })

    const topRestaurants = restaurants
      .map((r) => {
        const stats = countMap[r.id] || { orders: 0, revenue: 0 }
        const dishes = dishMap[r.id] || {}
        const topDish = Object.entries(dishes).sort((a, b) => b[1] - a[1])[0]?.[0]
        return {
          id: r.id,
          name: r.name,
          phone: r.restaurantPhone,
          orders: stats.orders,
          revenue: stats.revenue,
          topDish,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return { totalActive, topRestaurants }
  } catch (error) {
    console.error("Error fetching restaurants stats:", error)
    return { totalActive: 0, topRestaurants: [] }
  }
}

export const getTimeStats = async (): Promise<TimeStats> => {
  try {
    const start = subDays(startOfDay(new Date()), 6)
    const ordersSnapshot = await getDocs(
      query(collection(db, "orders"), where("fecha_creacion", ">=", start))
    )
    const perDayMap: Record<string, { sum: number; count: number }> = {}
    const perHourMap: Record<string, number> = {}

    ordersSnapshot.forEach((doc) => {
      const data = doc.data() as Order
      const created = (data.fecha_creacion instanceof Timestamp
        ? data.fecha_creacion.toDate()
        : data.fecha_creacion) as Date
      const day = format(created, "yyyy-MM-dd")
      const hour = created.getHours().toString()
      perHourMap[hour] = (perHourMap[hour] || 0) + 1
      if (data.estado === "Completados" && data.fecha_entrega) {
        const delivered = (data.fecha_entrega instanceof Timestamp
          ? data.fecha_entrega.toDate()
          : data.fecha_entrega) as Date
        const diff = (delivered.getTime() - created.getTime()) / 60000
        const entry = perDayMap[day] || { sum: 0, count: 0 }
        entry.sum += diff
        entry.count++
        perDayMap[day] = entry
      }
    })

    const perDay = Object.entries(perDayMap)
      .map(([date, { sum, count }]) => ({ date, avg: count ? sum / count : 0 }))
      .sort((a, b) => a.date.localeCompare(b.date))
    const perHour = Object.entries(perHourMap)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => Number(a.hour) - Number(b.hour))

    return { perDay, perHour }
  } catch (error) {
    console.error("Error fetching time stats:", error)
    return { perDay: [], perHour: [] }
  }
}
