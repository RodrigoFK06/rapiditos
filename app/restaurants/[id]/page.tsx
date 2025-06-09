"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useRestaurantStore } from "@/lib/stores/useRestaurantStore"
import { collection, doc, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Dish } from "@/lib/types"
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
  const [dishes, setDishes] = useState<Dish[]>([])

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantById(restaurantId)
      const q = query(
        collection(db, "platillos"),
        where("restaurantid", "==", doc(db, "restaurant", restaurantId)),
      )
      getDocs(q).then((snap) => {
        setDishes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Dish) })))
      })
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

        {/* General Information Card */}
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
            <span className="text-sm font-medium">Distrito:</span>
            <span className="text-sm">{currentRestaurant.district ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Categoría:</span>
            <span className="text-sm">{currentRestaurant.category}</span>
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
          {currentRestaurant.managerLastName && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Apellido Encargado:</span>
              <span className="text-sm">{currentRestaurant.managerLastName}</span>
            </div>
          )}
          {currentRestaurant.restaurantEmail && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{currentRestaurant.restaurantEmail}</span>
            </div>
          )}
          {currentRestaurant.webSite && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Sitio web:</span>
              <a
                href={currentRestaurant.webSite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline"
              >
                {currentRestaurant.webSite}
              </a>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm font-medium">Descripción:</span>
            <span className="text-sm text-right">{currentRestaurant.description}</span>
          </div>
          {currentRestaurant.reference_place && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Referencia:</span>
              <span className="text-sm">{currentRestaurant.reference_place}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm font-medium">Activo:</span>
            <Badge variant={currentRestaurant.isActive ? "default" : "secondary"}>
              {currentRestaurant.isActive ? "Sí" : "No"}
            </Badge>
          </div>
          {typeof currentRestaurant.yearFundation !== "undefined" && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Año de Fundación:</span>
              <span className="text-sm">{currentRestaurant.yearFundation}</span>
            </div>
          )}

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
          {currentRestaurant.doc_id_url && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Documento ID:</span>
              <a
                href={currentRestaurant.doc_id_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline"
              >
                Ver documento
              </a>
            </div>
          )}
          {currentRestaurant.doc_license_url && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Licencia:</span>
              <a
                href={currentRestaurant.doc_license_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline"
              >
                Ver documento
              </a>
            </div>
          )}

            {currentRestaurant.imageUrl && (
              <div className="mt-4">
                <img
                  src={currentRestaurant.imageUrl}
                  alt={currentRestaurant.name}
                  className="h-32 w-full object-cover rounded-md"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories Card */}
        <Card>
          <CardHeader>
            <CardTitle>Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentRestaurant.categorias?.map((cat) => (
                <Badge key={cat.NombreCategoria}>{cat.NombreCategoria}</Badge>
              ))}
            </div>
            {(!currentRestaurant.categorias || currentRestaurant.categorias.length === 0) && (
              <p className="text-sm text-muted-foreground">No hay categorías registradas</p>
            )}
          </CardContent>
        </Card>

        {/* Schedule Card */}
        <Card>
          <CardHeader>
            <CardTitle>Horarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentRestaurant.days?.map((d, index) => (
              <div key={`${d.day}-${index}`} className="flex justify-between">
                <span className="text-sm font-medium">{d.day}</span>
                <span className="text-sm">
                  {d.isOpen ? `${d.start ?? "00:00"} - ${d.end ?? "23:59"}` : "Cerrado"}
                </span>
              </div>
            ))}
            {(!currentRestaurant.days || currentRestaurant.days.length === 0) && (
              <p className="text-sm text-muted-foreground">No hay horarios registrados</p>
            )}
          </CardContent>
        </Card>

        {/* Dishes Card */}
        <Card>
          <CardHeader>
            <CardTitle>Platillos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dishes.map((p) => (
              <div key={p.id} className="flex justify-between items-center">
                <span className="text-sm font-medium">{p.Nombre ?? p.nombre}</span>
                <Badge variant="outline">S/ {p.Precio ?? p.precio}</Badge>
              </div>
            ))}
            {dishes.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay platillos registrados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}