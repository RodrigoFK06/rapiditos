"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useRestaurantStore } from "@/lib/stores/useRestaurantStore"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft } from "lucide-react"

export default function RestaurantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.id as string

  const { currentRestaurant, isLoading, fetchRestaurantById } = useRestaurantStore()

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantById(restaurantId)
    }
  }, [restaurantId, fetchRestaurantById])

  if (isLoading || !currentRestaurant) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{currentRestaurant.name}</h1>
            <p className="text-muted-foreground">Información del restaurante</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Datos Generales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Ciudad:</span>
              <span className="text-sm">{currentRestaurant.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Dirección:</span>
              <span className="text-sm">{currentRestaurant.addressText}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Encargado:</span>
              <span className="text-sm">{currentRestaurant.managerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Activo:</span>
              <Badge variant={currentRestaurant.isActive ? "default" : "secondary"}>
                {currentRestaurant.isActive ? "Sí" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
