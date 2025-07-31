"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import type { Restaurant } from "@/lib/types"
import { restaurantSchema, type RestaurantFormData } from "@/lib/validations/schemas"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurant: Restaurant
  onSave: (data: Partial<Restaurant>) => Promise<boolean>
}

export function EditRestaurantModalValidated({ open, onOpenChange, restaurant, onSave }: Props) {
  const { toast } = useToast()

  const form = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: "",
      description: "",
      addressText: "",
      district: "",
      city: "",
      category: "",
      restaurantPhone: "",
      restaurantEmail: "",
      webSite: "",
      managerName: "",
      managerLastName: "",
      reference_place: "",
      yearFundation: undefined,
      isActive: true,
      doc_ruc_url: "",
      doc_id_url: "",
      doc_license_url: "",
    },
  })

  // Cargar datos del restaurante cuando cambie
  useEffect(() => {
    if (restaurant) {
      form.reset({
        name: restaurant.name || "",
        description: restaurant.description || "",
        addressText: restaurant.addressText || "",
        district: restaurant.district || "",
        city: restaurant.city || "",
        category: restaurant.category || "",
        restaurantPhone: restaurant.restaurantPhone ? String(restaurant.restaurantPhone) : "",
        restaurantEmail: restaurant.restaurantEmail || "",
        webSite: restaurant.webSite || "",
        managerName: restaurant.managerName || "",
        managerLastName: restaurant.managerLastName || "",
        reference_place: restaurant.reference_place || "",
        yearFundation: restaurant.yearFundation ? Number(restaurant.yearFundation) : undefined,
        isActive: restaurant.isActive ?? true,
        doc_ruc_url: restaurant.doc_ruc_url || "",
        doc_id_url: restaurant.doc_id_url || "",
        doc_license_url: restaurant.doc_license_url || "",
      })
    }
  }, [restaurant, form])

  const onSubmit = async (data: RestaurantFormData) => {
    try {
      // Convertir tipos de datos antes de guardar
      const processedData = {
        ...data,
        yearFundation: data.yearFundation ? String(data.yearFundation) : undefined,
        restaurantPhone: data.restaurantPhone ? parseInt(data.restaurantPhone, 10) : undefined,
      } as Partial<Restaurant>
      
      const success = await onSave(processedData)
      if (success) {
        toast({
          title: "Éxito",
          description: "Restaurante actualizado correctamente",
        })
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar el restaurante",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Restaurante</DialogTitle>
          <DialogDescription>
            Modifica la información del restaurante
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del restaurante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría *</FormLabel>
                    <FormControl>
                      <Input placeholder="Categoría" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción del restaurante" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="restaurantPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono *</FormLabel>
                    <FormControl>
                      <Input placeholder="987654321" {...field} />
                    </FormControl>
                    <FormDescription>9 dígitos</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="restaurantEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="restaurante@ejemplo.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="addressText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección *</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección completa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yearFundation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año de Fundación</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="2020" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distrito *</FormLabel>
                    <FormControl>
                      <Input placeholder="Distrito" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ciudad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="managerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Encargado *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managerLastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido del Encargado</FormLabel>
                    <FormControl>
                      <Input placeholder="Apellido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="webSite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sitio Web</FormLabel>
                  <FormControl>
                    <Input 
                      type="url"
                      placeholder="https://www.ejemplo.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference_place"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia del Lugar</FormLabel>
                  <FormControl>
                    <Input placeholder="Cerca del parque principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Restaurante Activo</FormLabel>
                    <FormDescription>
                      El restaurante puede recibir pedidos
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
