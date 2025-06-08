"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useRiderStore } from "@/lib/stores/useRiderStore"
import { useUserStore } from "@/lib/stores/useUserStore"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft } from "lucide-react"

export default function RiderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const riderId = params.id as string

  const { currentRider, isLoading, fetchRiderById } = useRiderStore()
  const { currentUser, fetchUserById } = useUserStore()

  useEffect(() => {
    if (riderId) {
      fetchRiderById(riderId)
    }
  }, [riderId, fetchRiderById])

  useEffect(() => {
    if (currentRider && currentRider.user_ref) {
      fetchUserById(currentRider.user_ref)
    }
  }, [currentRider, fetchUserById])

  if (isLoading || !currentRider) {
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
            <h1 className="text-3xl font-bold tracking-tight">{currentRider.display_name}</h1>
            <p className="text-muted-foreground">Perfil del repartidor</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Teléfono:</span>
              <span className="text-sm">{currentRider.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Usuario:</span>
              <span className="text-sm">{currentRider.user_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Activo:</span>
              <Badge variant={currentRider.isActive ? "default" : "secondary"}>
                {currentRider.isActive ? "Sí" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {currentUser && (
          <Card>
            <CardHeader>
              <CardTitle>Usuario Base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Nombre:</span>
                <span className="text-sm">{currentUser.display_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{currentUser.email}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
