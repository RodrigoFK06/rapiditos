"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useOrderStore } from "@/lib/stores/useOrderStore"
import { useRiderStore } from "@/lib/stores/useRiderStore"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User, Restaurant, ClientAddress, Rider } from "@/lib/types"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, User } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { OrderStatus } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const { currentOrder, orderDetails, isLoading, fetchOrderById, fetchOrderDetails, updateStatus, assignRider } =
    useOrderStore()

  const { activeRiders, fetchActiveRiders } = useRiderStore()

  const [client, setClient] = useState<User | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [address, setAddress] = useState<ClientAddress | null>(null)
  const [assignedRider, setAssignedRider] = useState<Rider | null>(null)

  useEffect(() => {
    if (orderId) {
      fetchOrderById(orderId)
      fetchOrderDetails(orderId)
      fetchActiveRiders()
    }
  }, [orderId, fetchOrderById, fetchOrderDetails, fetchActiveRiders])

  useEffect(() => {
    if (currentOrder) {
      if (currentOrder.cliente_ref) {
        getDoc(doc(db, "users", currentOrder.cliente_ref)).then((snap) => {
          if (snap.exists()) setClient({ id: snap.id, ...(snap.data() as User) })
        })
      }
      if (currentOrder.restaurantref) {
        getDoc(doc(db, "restaurant", currentOrder.restaurantref)).then((snap) => {
          if (snap.exists())
            setRestaurant({ id: snap.id, ...(snap.data() as Restaurant) })
        })
      }
      if (currentOrder.client_address_ref) {
        getDoc(doc(db, "ClientAddress", currentOrder.client_address_ref)).then((snap) => {
          if (snap.exists()) setAddress({ id: snap.id, ...(snap.data() as ClientAddress) })
        })
      }
      if (currentOrder.assigned_rider_ref) {
        getDoc(doc(db, "rider", currentOrder.assigned_rider_ref)).then((snap) => {
          if (snap.exists()) setAssignedRider({ id: snap.id, ...(snap.data() as Rider) })
        })
      }
    }
  }, [currentOrder])

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!currentOrder) return

    const success = await updateStatus(currentOrder.id, newStatus)
    if (success) {
      toast.success("Estado del pedido actualizado correctamente")
    } else {
      toast.error("Error al actualizar el estado del pedido")
    }
  }

  const handleRiderAssignment = async (riderId: string) => {
    if (!currentOrder) return

    const success = await assignRider(currentOrder.id, riderId)
    if (success) {
      toast.success("Repartidor asignado correctamente")
    } else {
      toast.error("Error al asignar el repartidor")
    }
  }

  if (isLoading || !currentOrder) {
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
            <h1 className="text-3xl font-bold tracking-tight">Pedido #{currentOrder.pedido_id}</h1>
            <p className="text-muted-foreground">Detalles completos del pedido</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Estado:</span>
                <StatusBadge status={currentOrder.estado} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Cliente:</span>
                <span className="text-sm">
                  {client ? client.display_name : currentOrder.cliente_nombre}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Restaurante:</span>
                <span className="text-sm">
                  {restaurant ? restaurant.name : currentOrder.restaurante_nombre}
                </span>
              </div>
              {address && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Dirección:</span>
                  <span className="text-sm">{address.address}</span>
                </div>
              )}
              {assignedRider && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Rider asignado:</span>
                  <span className="text-sm">{assignedRider.display_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total:</span>
                <Badge variant="outline">{formatCurrency(currentOrder.total)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Método de pago:</span>
                <span className="text-sm">{currentOrder.metodo_pago}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Fecha:</span>
                <span className="text-sm">{formatDate(currentOrder.fecha_creacion)}</span>
              </div>
              {currentOrder.note && (
                <div>
                  <span className="text-sm font-medium">Nota:</span>
                  <p className="text-sm text-muted-foreground mt-1">{currentOrder.note}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Management */}
          <Card>
            <CardHeader>
              <CardTitle>Gestión del Pedido</CardTitle>
              <CardDescription>Actualiza el estado y asigna repartidor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Estado del pedido</label>
                <Select value={currentOrder.estado} onValueChange={(value) => handleStatusUpdate(value as OrderStatus)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nuevo">Nuevo</SelectItem>
                    <SelectItem value="Preparando">Preparando</SelectItem>
                    <SelectItem value="Enviando">Enviando</SelectItem>
                    <SelectItem value="Completado">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Repartidor asignado</label>
                <Select value={currentOrder.assigned_rider_ref || ""} onValueChange={handleRiderAssignment}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar repartidor" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeRiders.map((rider) => (
                      <SelectItem key={rider.id} value={rider.id}>
                        {rider.display_name} - {rider.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between">
                <span className="text-sm font-medium">Asignado:</span>
                <Badge variant={currentOrder.asigned ? "default" : "secondary"}>
                  {currentOrder.asigned ? "Sí" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Pedido</CardTitle>
            <CardDescription>Productos incluidos en este pedido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderDetails.map((detail) => (
                <div key={detail.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img
                      src={detail.imagen || "/placeholder.svg"}
                      alt={detail.nombre}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                    <div>
                      <p className="font-medium">{detail.nombre}</p>
                      <p className="text-sm text-muted-foreground">Cantidad: {detail.cantidad}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(detail.subtotal)}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(detail.precio_unitario)} c/u</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
