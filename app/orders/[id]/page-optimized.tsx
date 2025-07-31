"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useOrderDetail } from "@/hooks/useOrderDetail"
import { useOrderRelatedData } from "@/hooks/useParallelData"

export default function OrderDetailPageOptimized() {
  const params = useParams()
  const orderId = params.id as string

  const { order, isLoading: orderLoading, error: orderError } = useOrderDetail(orderId)
  const { client, restaurant, isLoading: relatedLoading, errors } = useOrderRelatedData(order)

  const isLoading = orderLoading || relatedLoading

  if (orderLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  if (orderError) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>{orderError}</AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold">Pedido no encontrado</h2>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
          <Badge variant={order.estado === "Completados" ? "default" : "secondary"}>
            {order.estado}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información del pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Total:</span>
                <span>S/. {order.total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Estado:</span>
                <Badge variant="outline">{order.estado}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Fecha:</span>
                <span>
                  {order.fecha_creacion 
                    ? new Date(order.fecha_creacion).toLocaleString()
                    : "N/A"
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Información del cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {relatedLoading ? (
                <div className="flex items-center justify-center h-20">
                  <LoadingSpinner size="sm" />
                </div>
              ) : errors.client ? (
                <Alert variant="destructive">
                  <AlertDescription>{errors.client}</AlertDescription>
                </Alert>
              ) : client ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Nombre:</span>
                    <span>{client.display_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{client.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Teléfono:</span>
                    <span>{client.phone}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No hay información del cliente</p>
              )}
            </CardContent>
          </Card>

          {/* Información del restaurante */}
          <Card>
            <CardHeader>
              <CardTitle>Restaurante</CardTitle>
            </CardHeader>
            <CardContent>
              {relatedLoading ? (
                <div className="flex items-center justify-center h-20">
                  <LoadingSpinner size="sm" />
                </div>
              ) : errors.restaurant ? (
                <Alert variant="destructive">
                  <AlertDescription>{errors.restaurant}</AlertDescription>
                </Alert>
              ) : restaurant ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Nombre:</span>
                    <span>{restaurant.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Ciudad:</span>
                    <span>{restaurant.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Teléfono:</span>
                    <span>{restaurant.restaurantPhone}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No hay información del restaurante</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
