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
              <span className="text-sm font-medium">Teléfono:</span>
              <span className="text-sm">{currentRestaurant.restaurantPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Encargado:</span>
              <span className="text-sm">{currentRestaurant.managerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Descripción:</span>
              <span className="text-sm text-right">{currentRestaurant.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Activo:</span>
              <Badge variant={currentRestaurant.isActive ? "default" : "secondary"}>
                {currentRestaurant.isActive ? "Sí" : "No"}
              </Badge>
            </div>

            {currentRestaurant.doc_ruc_url && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Documento RUC:</span>
                <a
                  href={currentRestaurant.doc_ruc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                >
                  Ver documento
                </a>
              </div>
            )}

            {currentRestaurant.imageUrl && (
              <img
                src={currentRestaurant.imageUrl}
                alt={currentRestaurant.name}
                className="h-32 w-full object-cover rounded-md"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorías</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {currentRestaurant.categorias?.map((cat, index) => (
              <Badge key={index}>{cat?.NombreCategoria}</Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentRestaurant.days?.map((d) => (
              <div key={d.day} className="flex justify-between">
                <span className="text-sm font-medium">{d.day}</span>
                <span className="text-sm">
                  {d.isOpen ? `${d.start ?? "00:00"} - ${d.end ?? "23:59"}` : "Cerrado"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platillos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentRestaurant.platillos?.map((p, index) => (
              <div key={`${p.Nombre}-${index}`} className="flex justify-between">
                <span className="text-sm font-medium">{p.Nombre}</span>
                <span className="text-sm">S/ {p.Precio}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
