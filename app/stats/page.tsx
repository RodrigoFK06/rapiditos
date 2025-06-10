"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { OrdersStatsCard } from "@/components/stats/orders-stats"
import { TopDishesCard } from "@/components/stats/top-dishes"
import { RidersStatsCard } from "@/components/stats/riders-stats"
import { RestaurantsStatsCard } from "@/components/stats/restaurants-stats"
import { KpiCards } from "@/components/stats/kpi-cards"
import { TimeStatsCard } from "@/components/stats/time-stats"
import {
  getDashboardKpis,
  getOrdersStats,
  getTopDishes,
  getRidersStats,
  getRestaurantsStats,
  getTimeStats,
} from "@/lib/services/statsService"
import type {
  DashboardKpis,
  OrdersStats,
  TopDish,
  RidersStats,
  RestaurantsStats,
  TimeStats,
} from "@/lib/types"

export default function StatsPage() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [orders, setOrders] = useState<OrdersStats | null>(null)
  const [dishes, setDishes] = useState<TopDish[]>([])
  const [riders, setRiders] = useState<RidersStats | null>(null)
  const [restaurants, setRestaurants] = useState<RestaurantsStats | null>(null)
  const [timeStats, setTimeStats] = useState<TimeStats | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [k, o, d, r, res, t] = await Promise.all([
        getDashboardKpis(),
        getOrdersStats(),
        getTopDishes(),
        getRidersStats(),
        getRestaurantsStats(),
        getTimeStats(),
      ])
      setKpis(k)
      setOrders(o)
      setDishes(d)
      setRiders(r)
      setRestaurants(res)
      setTimeStats(t)
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
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
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
        {kpis && <KpiCards data={kpis} />}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {orders && <OrdersStatsCard data={orders} />}
          <TopDishesCard dishes={dishes} />
          {riders && <RidersStatsCard data={riders} />}
          {restaurants && <RestaurantsStatsCard data={restaurants} />}
          {timeStats && <TimeStatsCard data={timeStats} />}
        </div>
      </div>
    </DashboardLayout>
  )
}
