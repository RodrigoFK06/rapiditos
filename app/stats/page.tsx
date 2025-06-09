"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { OrdersStatsCard } from "@/components/stats/orders-stats"
import { TopDishesCard } from "@/components/stats/top-dishes"
import { RidersStatsCard } from "@/components/stats/riders-stats"
import { RestaurantsStatsCard } from "@/components/stats/restaurants-stats"
import {
  getOrdersStats,
  getTopDishes,
  getRidersStats,
  getRestaurantsStats,
} from "@/lib/services/statsService"
import type {
  OrdersStats,
  TopDish,
  RidersStats,
  RestaurantsStats,
} from "@/lib/types"

export default function StatsPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrdersStats | null>(null)
  const [dishes, setDishes] = useState<TopDish[]>([])
  const [riders, setRiders] = useState<RidersStats | null>(null)
  const [restaurants, setRestaurants] = useState<RestaurantsStats | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [o, d, r, res] = await Promise.all([
        getOrdersStats(),
        getTopDishes(),
        getRidersStats(),
        getRestaurantsStats(),
      ])
      setOrders(o)
      setDishes(d)
      setRiders(r)
      setRestaurants(res)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
          <p className="text-muted-foreground">Datos analíticos de la plataforma</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {orders && <OrdersStatsCard data={orders} />}
          <TopDishesCard dishes={dishes} />
          {riders && <RidersStatsCard data={riders} />}
          {restaurants && <RestaurantsStatsCard data={restaurants} />}
        </div>
      </div>
    </DashboardLayout>
  )
}
