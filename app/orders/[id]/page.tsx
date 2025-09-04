"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useOrderStore } from "@/lib/stores/useOrderStore"
import { useRiderStore } from "@/lib/stores/useRiderStore"
import { doc, getDoc, updateDoc, runTransaction } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User, Restaurant, ClientAddress, Rider } from "@/lib/types"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, UserIcon, Pin } from "lucide-react"
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

  // Bloquear acceso a pedidos no confirmados (admin_view !== true)
  useEffect(() => {
    if (currentOrder === null) {
      // Pedido no accesible o inexistente: enviar a listado sin filtrar info
      router.replace('/orders')
    }
  }, [currentOrder, router])

  useEffect(() => {
    if (currentOrder) {
      // Fetch client data
      if (currentOrder.cliente_ref) {
        getDoc(currentOrder.cliente_ref).then((snap) => {
          if (snap.exists()) setClient({ ...snap.data() as User, uid: snap.id })
        })
      }
      
      // Fetch restaurant data
      if (currentOrder.restaurantref) {
        getDoc(currentOrder.restaurantref).then((snap) => {
          if (snap.exists())
            setRestaurant({ ...snap.data() as Restaurant, uid: snap.id })
        })
      }
      
      // Fetch client address data
      if (currentOrder.client_address_ref) {
        getDoc(currentOrder.client_address_ref).then((snap) => {
          if (snap.exists())
            setAddress({ ...snap.data() as ClientAddress, uid: snap.id })
        })
      }
      
      // Fetch assigned rider data
      if (currentOrder.assigned_rider_ref) {
        getDoc(currentOrder.assigned_rider_ref).then((snap) => {
          if (snap.exists())
            setAssignedRider({ ...snap.data() as Rider, uid: snap.id })
        })
      }
    }
  }, [currentOrder])

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!currentOrder) return

    try {
      // 1. ✅ Lógica para estado "Preparando" - Generar pickup_pin
      if (newStatus === "Preparando") {
        const pickupPin = Math.floor(Math.random() * 900 + 100).toString() // PIN de 3 dígitos
        
        await runTransaction(db, async (transaction) => {
          const orderRef = doc(db, "orders", currentOrder.id)
          transaction.update(orderRef, {
            estado: newStatus,
            pickup_pin: pickupPin,
            ready_to_pay: true, // ✅ AGREGADO: ready_to_pay pasa a true
            activo: true // ✅ AGREGADO: activo pasa a true
          })
        })

        // Actualizar estado local para mostrar el PIN inmediatamente
        const updatedOrder = { ...currentOrder, estado: newStatus, pickup_pin: pickupPin }
        // Aquí podrías actualizar el store local si tienes un método para ello

        toast.success(`Estado actualizado a "Preparando". PIN generado: ${pickupPin}`)
        
        // Refrescar datos del pedido
        fetchOrderById(orderId)
        return
      }

      // 2. ✅ Lógica para estado "Completados" - Limpieza completa
      if (newStatus === "Completados") {
        console.log("🔥 ENTRANDO EN LÓGICA DE COMPLETADOS")
        console.log("🔍 ORDEN COMPLETA:", currentOrder)
        console.log("🔍 currentOrder.cliente_ref:", currentOrder.cliente_ref?.id)
        console.log("🔍 currentOrder.rider_ref:", currentOrder.rider_ref?.id)
        console.log("🔍 Posibles campos de cliente:", {
          cliente_ref: currentOrder.cliente_ref,
          clienteref: (currentOrder as any).clienteref,
          client_ref: (currentOrder as any).client_ref,
          clientRef: (currentOrder as any).clientRef,
          user_ref: (currentOrder as any).user_ref
        })
        console.log("🔍 Posibles campos de rider:", {
          rider_ref: currentOrder.rider_ref,
          riderRef: (currentOrder as any).riderRef,
          assigned_rider_ref: currentOrder.assigned_rider_ref
        })
        
        await runTransaction(db, async (transaction) => {
          const orderRef = doc(db, "orders", currentOrder.id)
          
          // IMPORTANTE: Todas las LECTURAS primero (antes de cualquier escritura)
          let riderData = null
          if (currentOrder.rider_ref) {
            const riderDoc = await transaction.get(currentOrder.rider_ref)
            if (riderDoc.exists()) {
              riderData = riderDoc.data()
              console.log("📋 Datos del rider leídos:", riderData.active_orders, riderData.number_deliverys)
            }
          }

          let clientData = null
          if ((currentOrder as any).clienteref) {
            const clientDoc = await transaction.get((currentOrder as any).clienteref)
            if (clientDoc.exists()) {
              clientData = clientDoc.data()
              console.log("👤 Datos del cliente leídos:", (clientData as any)?.activeorders)
            }
          }

          // Ahora todas las ESCRITURAS después de las lecturas
          
          // A. Actualizar campos del pedido
          transaction.update(orderRef, {
            estado: newStatus,
            activo: false, // ✅ CORREGIDO: debe ser false cuando está completado (ya no activo)
            fecha_entrega: new Date()
          })

          // B. Limpiar chat_ref del cliente y actualizar activeorders
          if ((currentOrder as any).clienteref && clientData) {
            console.log("✅ ACTUALIZANDO CLIENTE - activeorders: 0")
            transaction.update((currentOrder as any).clienteref, {
              chat_ref: null,
              activeorders: 0 // ✅ AGREGADO: activeorders pasa a 0 cuando se completa
            })
          } else {
            console.log("❌ NO SE ACTUALIZA CLIENTE:", {
              tieneRef: !!(currentOrder as any).clienteref,
              tieneData: !!clientData
            })
          }

          // C. Limpiar asignación del rider
          if (currentOrder.rider_ref && riderData) {
            const currentDeliveries = riderData.number_deliverys || 0
            const currentActiveOrders = riderData.active_orders || 0
            console.log("✅ ACTUALIZANDO RIDER - active_orders:", currentActiveOrders, "→", Math.max(0, currentActiveOrders - 1))
            
            transaction.update(currentOrder.rider_ref, {
              asigned_rider_ref: null,
              asigned_rider_ref2: null,
              active_orders: Math.max(0, currentActiveOrders - 1), // ✅ CORREGIDO: decrementar -1, no poner en 0
              number_deliverys: currentDeliveries + 1
            })
          } else {
            console.log("❌ NO SE ACTUALIZA RIDER:", {
              tieneRef: !!currentOrder.rider_ref,
              tieneData: !!riderData
            })
          }
        })

        toast.success("Pedido marcado como completado. Se han limpiado todas las referencias.")
        
        // Refrescar datos del pedido
        fetchOrderById(orderId)
        return
      }

      // 3. ✅ Para otros estados (Nuevo, Enviando) - Solo actualizar estado
      const success = await updateStatus(currentOrder.id, newStatus)
      if (success) {
        toast.success("Estado del pedido actualizado correctamente")
      } else {
        toast.error("Error al actualizar el estado del pedido")
      }

    } catch (error) {
      console.error("Error al actualizar estado del pedido:", error)
      toast.error("Error al procesar la actualización del pedido")
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
                <UserIcon className="h-5 w-5" />
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
              {(currentOrder as any).pickup_pin && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Pin className="h-4 w-4" />
                    PIN de Recogida:
                  </span>
                  <Badge variant="default" className="font-mono text-lg">
                    {(currentOrder as any).pickup_pin}
                  </Badge>
                </div>
              )}
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
                    <SelectItem value="Completados">Completados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Repartidor asignado</label>
                <Select value={currentOrder.assigned_rider_ref?.id || ""} onValueChange={handleRiderAssignment}>
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