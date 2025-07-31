"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import type { Restaurant } from "@/lib/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurant: Restaurant
  onSave: (data: Partial<Restaurant>) => Promise<boolean>
}

export function EditRestaurantModal({ open, onOpenChange, restaurant, onSave }: Props) {
  const [form, setForm] = useState({
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
    yearFundation: "",
    isActive: false,
    doc_ruc_url: "",
    doc_id_url: "",
    doc_license_url: "",
    // Campos adicionales según esquema Firestore
    numDoc: "",
    typeDoc: "",
    instagram: "",
    facebook: "",
    restaurant_zone: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name ?? "",
        description: restaurant.description ?? "",
        addressText: restaurant.addressText ?? "",
        district: restaurant.district ?? "",
        city: restaurant.city ?? "",
        category: restaurant.category ?? "",
        restaurantPhone: restaurant.restaurantPhone ? String(restaurant.restaurantPhone) : "",
        restaurantEmail: restaurant.restaurantEmail ?? "",
        webSite: restaurant.webSite ?? "",
        managerName: restaurant.managerName ?? "",
        managerLastName: restaurant.managerLastName ?? "",
        reference_place: restaurant.reference_place ?? "",
        yearFundation: restaurant.yearFundation ? String(restaurant.yearFundation) : "",
        isActive: restaurant.isActive ?? false,
        doc_ruc_url: restaurant.doc_ruc_url ?? "",
        doc_id_url: restaurant.doc_id_url ?? "",
        doc_license_url: restaurant.doc_license_url ?? "",
        // Campos adicionales según esquema Firestore
        numDoc: restaurant.numDoc ? String(restaurant.numDoc) : "",
        typeDoc: restaurant.typeDoc ?? "",
        instagram: restaurant.instagram ?? "",
        facebook: restaurant.facebook ?? "",
        restaurant_zone: restaurant.restaurant_zone ?? "",
      })
    }
  }, [restaurant])

  const handleSave = async () => {
    setSaving(true)
    const { yearFundation, restaurantPhone, numDoc, ...rest } = form
    const data: Partial<Restaurant> = {
      ...rest,
      yearFundation: yearFundation || undefined, // ✅ String
      restaurantPhone: restaurantPhone ? parseInt(restaurantPhone, 10) : undefined, // ✅ Integer
      numDoc: numDoc ? parseInt(numDoc, 10) : undefined, // ✅ Integer
    } as Partial<Restaurant>
    const success = await onSave(data)
    setSaving(false)
    if (success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar restaurante</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={form.addressText}
              onChange={(e) => setForm({ ...form, addressText: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="district">Distrito</Label>
              <Input
                id="district"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Input
              id="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={form.restaurantPhone}
              onChange={(e) => setForm({ ...form, restaurantPhone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={form.restaurantEmail}
              onChange={(e) => setForm({ ...form, restaurantEmail: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Sitio web</Label>
            <Input
              id="website"
              value={form.webSite}
              onChange={(e) => setForm({ ...form, webSite: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="managerName">Encargado</Label>
              <Input
                id="managerName"
                value={form.managerName}
                onChange={(e) => setForm({ ...form, managerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="managerLastName">Apellido Encargado</Label>
              <Input
                id="managerLastName"
                value={form.managerLastName}
                onChange={(e) => setForm({ ...form, managerLastName: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">Referencia</Label>
            <Input
              id="reference"
              value={form.reference_place}
              onChange={(e) => setForm({ ...form, reference_place: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Año de fundación</Label>
            <Input
              id="year"
              type="number"
              value={form.yearFundation}
              onChange={(e) => setForm({ ...form, yearFundation: e.target.value })}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={form.isActive}
              onCheckedChange={(value) => setForm({ ...form, isActive: value })}
            />
            <span className="text-sm">Activo</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc_ruc_url">Documento RUC</Label>
            <Input
              id="doc_ruc_url"
              value={form.doc_ruc_url}
              onChange={(e) => setForm({ ...form, doc_ruc_url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc_id_url">Documento ID</Label>
            <Input
              id="doc_id_url"
              value={form.doc_id_url}
              onChange={(e) => setForm({ ...form, doc_id_url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc_license_url">Licencia</Label>
            <Input
              id="doc_license_url"
              value={form.doc_license_url}
              onChange={(e) => setForm({ ...form, doc_license_url: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
