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
import { ArrowLeft, User, Phone, Mail } from "lucide-react"

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
      // Handle both string and object reference formats
      const userRef = typeof currentRider.user_ref === 'string' 
        ? currentRider.user_ref 
        : currentRider.user_ref.id
      
      if (userRef) {
        fetchUserById(userRef)
      }
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
        {/* Header Section */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{currentRider.display_name}</h1>
            <p className="text-muted-foreground">Perfil del repartidor</p>
          </div>
        </div>

        {/* Rider Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Repartidor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono:
              </span>
              <span className="text-sm">{currentRider.phone}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Usuario:</span>
              <span className="text-sm">{currentRider.user_name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Estado:</span>
              <Badge variant={currentRider.isActive ? "default" : "secondary"}>
                {currentRider.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>

            {currentRider.vehicle_type && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Vehículo:</span>
                <span className="text-sm">{currentRider.vehicle_type}</span>
              </div>
            )}

            {currentRider.license_plate && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Placa:</span>
                <span className="text-sm font-mono">{currentRider.license_plate}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Base Information Card */}
        {currentUser && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Información de Usuario Base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Nombre completo:</span>
                <span className="text-sm">{currentUser.display_name}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{currentUser.email}</span>
              </div>

              {currentUser.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Teléfono base:</span>
                  <span className="text-sm">{currentUser.phone}</span>
                </div>
              )}

              {currentUser.created_at && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Registrado:</span>
                  <span className="text-sm">
                    {new Date(currentUser.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Statistics Card (if you have delivery stats) */}
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {currentRider.total_deliveries || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Entregas totales
                </div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {currentRider.rating ? `${currentRider.rating}/5` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Calificación
                </div>
              </div>
            </div>

            {currentRider.last_delivery_date && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Última entrega:</span>
                <span className="text-sm">
                  {new Date(currentRider.last_delivery_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}