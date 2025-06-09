"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useRiderStore } from "@/lib/stores/useRiderStore"
import { useUserStore } from "@/lib/stores/useUserStore"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { ArrowLeft, User, Phone, Mail, Check, X } from "lucide-react"

export default function RiderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const riderId = params.id as string

  const { currentRider, isLoading, fetchRiderById, updateRiderData } = useRiderStore()
  const { currentUser, fetchUserById } = useUserStore()

  const [editOpen, setEditOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editData, setEditData] = useState({
    display_name: "",
    phone: "",
    user_name: "",
    active_rider: false,
    photo_url: "",
  })

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

  useEffect(() => {
    if (currentRider) {
      setEditData({
        display_name: currentRider.display_name,
        phone: currentRider.phone,
        user_name: currentRider.user_name,
        active_rider: currentRider.active_rider,
        photo_url: currentRider.photo_url,
      })
    }
  }, [currentRider])

  const handleUpdate = async () => {
    setIsUpdating(true)
    const success = await updateRiderData(riderId, editData)
    if (success) {
      toast.success("Repartidor actualizado correctamente")
      setEditOpen(false)
      fetchRiderById(riderId)
    } else {
      toast.error("Error al actualizar el repartidor")
    }
    setIsUpdating(false)
  }

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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{currentRider.display_name}</h1>
              <p className="text-muted-foreground">Perfil del repartidor</p>
            </div>
          </div>
          <Button onClick={() => setEditOpen(true)}>Editar</Button>
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
              <Badge
                variant={currentRider.active_rider ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                {currentRider.active_rider ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                {currentRider.active_rider ? "Sí" : "No"}
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

              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {currentRider.active_orders || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Pedidos activos
                </div>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {currentRider.number_deliverys || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Entregas realizadas
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

        {/* Edit Rider Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar repartidor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Nombre</Label>
                <Input
                  id="display_name"
                  value={editData.display_name}
                  onChange={(e) =>
                    setEditData({ ...editData, display_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={editData.phone}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user_name">Usuario</Label>
                <Input
                  id="user_name"
                  value={editData.user_name}
                  onChange={(e) =>
                    setEditData({ ...editData, user_name: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editData.active_rider}
                  onCheckedChange={(value) =>
                    setEditData({ ...editData, active_rider: value })
                  }
                />
                <span className="text-sm">Activo</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo_url">Foto (URL)</Label>
                {editData.photo_url && (
                  <img
                    src={editData.photo_url}
                    alt="Foto de perfil"
                    className="h-24 w-24 object-cover rounded-md"
                  />
                )}
                <Input
                  id="photo_url"
                  value={editData.photo_url}
                  onChange={(e) =>
                    setEditData({ ...editData, photo_url: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}