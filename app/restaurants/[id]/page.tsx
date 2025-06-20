"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useRestaurantStore } from "@/lib/stores/useRestaurantStore"
import { collection, doc, getDocs, query, where, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Dish, Restaurant } from "@/lib/types"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft } from "lucide-react"
import { EditRestaurantModal } from "@/components/restaurants/edit-restaurant-modal"
import { toast } from "sonner"

export default function RestaurantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.id as string

  const {
    currentRestaurant,
    isLoading,
    fetchRestaurantById,
    updateRestaurantData,
  } = useRestaurantStore()
  const [dishes, setDishes] = useState<Dish[]>([])
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editRestaurantOpen, setEditRestaurantOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editData, setEditData] = useState({
    nombre: "",
    descripcion: "",
    precio: 0,
    categoria: "",
    activo: false,
    imagen: "",
  })

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

  const handleEditDish = async () => {
    if (!selectedDish?.id) return
    
    setIsUpdating(true)
    try {
      await updateDoc(doc(db, "platillos", selectedDish.id), {
        nombre: editData.nombre,
        descripcion: editData.descripcion,
        precio: editData.precio,
        categoria: editData.categoria,
        activo: editData.activo,
        imagen: editData.imagen,
      })
      
      // Update local state
      setDishes((prev) =>
        prev.map((d) =>
          d.id === selectedDish.id
            ? {
                ...d,
                nombre: editData.nombre,
                Nombre: editData.nombre,
                descripcion: editData.descripcion,
                Descripcion: editData.descripcion,
                precio: editData.precio,
                Precio: editData.precio,
                categoria: editData.categoria,
                Categoria: editData.categoria,
                activo: editData.activo,
                Activo: editData.activo,
                imagen: editData.imagen,
                Imagen: editData.imagen,
              }
            : d
        )
      )
      setEditOpen(false)
    } catch (err) {
      console.error("Error updating dish:", err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRestaurantUpdate = async (data: Partial<Restaurant>) => {
    if (!currentRestaurant) return false

    const success = await updateRestaurantData(currentRestaurant.id, data)
    if (success) {
      toast.success("Restaurante actualizado")
      fetchRestaurantById(currentRestaurant.id)
    } else {
      toast.error("Error al actualizar el restaurante")
    }
    return success
  }

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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{currentRestaurant.name}</h1>
              <p className="text-muted-foreground">Información del restaurante</p>
            </div>
          </div>
          <Button onClick={() => setEditRestaurantOpen(true)}>Editar restaurante</Button>
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
                <div className="flex items-center gap-2">
                  <Badge variant="outline">S/ {p.Precio ?? p.precio}</Badge>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedDish(p)
                      setViewOpen(true)
                    }}
                  >
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDish(p)
                      setEditData({
                        nombre: p.Nombre ?? p.nombre ?? "",
                        descripcion: p.Descripcion ?? p.descripcion ?? "",
                        precio: p.Precio ?? p.precio ?? 0,
                        categoria: p.Categoria ?? p.categoria ?? "",
                        activo: p.Activo ?? p.activo ?? false,
                        imagen: p.Imagen ?? p.imagen ?? "",
                      })
                      setEditOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                </div>
              </div>
            ))}
            {dishes.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay platillos registrados</p>
            )}
          </CardContent>
        </Card>

        {/* View Dish Dialog */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedDish?.Nombre ?? selectedDish?.nombre}</DialogTitle>
            </DialogHeader>
            {selectedDish && (
              <div className="space-y-2">
                <p className="text-sm">{selectedDish.Descripcion ?? selectedDish.descripcion}</p>
                <p className="text-sm">Precio: S/ {selectedDish.Precio ?? selectedDish.precio}</p>
                <p className="text-sm">Categoría: {selectedDish.Categoria ?? selectedDish.categoria}</p>
                <p className="text-sm flex items-center gap-2">
                  Activo:
                  <Badge variant={(selectedDish.Activo ?? selectedDish.activo) ? "default" : "secondary"}>
                    {(selectedDish.Activo ?? selectedDish.activo) ? "Sí" : "No"}
                  </Badge>
                </p>
                {(selectedDish.Imagen ?? selectedDish.imagen) && (
                  <img
                    src={selectedDish.Imagen ?? selectedDish.imagen}
                    alt={selectedDish.Nombre ?? selectedDish.nombre}
                    className="mx-auto mt-2 h-40 w-full object-cover rounded-md"
                  />
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dish Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar platillo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Nombre"
                  value={editData.nombre}
                  onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Textarea
                  placeholder="Descripción"
                  value={editData.descripcion}
                  onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Precio"
                  value={editData.precio}
                  onChange={(e) => setEditData({ ...editData, precio: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Select
                  value={editData.categoria}
                  onValueChange={(value) => setEditData({ ...editData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentRestaurant.categorias?.map((cat) => (
                      <SelectItem key={cat.NombreCategoria} value={cat.NombreCategoria}>
                        {cat.NombreCategoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editData.activo}
                  onCheckedChange={(value) => setEditData({ ...editData, activo: value })}
                />
                <span className="text-sm">Activo</span>
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="URL de imagen"
                  value={editData.imagen}
                  onChange={(e) => setEditData({ ...editData, imagen: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleEditDish}
                disabled={isUpdating}
              >
                {isUpdating ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <EditRestaurantModal
          open={editRestaurantOpen}
          onOpenChange={setEditRestaurantOpen}
          restaurant={currentRestaurant}
          onSave={handleRestaurantUpdate}
        />
      </div>
    </DashboardLayout>
  )
}