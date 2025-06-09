"use client"

import { useEffect } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { useRestaurantStore } from "@/lib/stores/useRestaurantStore"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Eye } from "lucide-react"
import type { Restaurant } from "@/lib/types"

const columns: ColumnDef<Restaurant>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "city",
    header: "Ciudad",
  },
  {
    accessorKey: "managerName",
    header: "Encargado",
  },
  {
    accessorKey: "isActive",
    header: "Activo",
    cell: ({ row }) => (
      <Badge variant={row.getValue("isActive") ? "default" : "secondary"}>{row.getValue("isActive") ? "Sí" : "No"}</Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const restaurant = row.original
      return (
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/restaurants/${restaurant.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      )
    },
  },
]

export default function RestaurantsPage() {
  const { restaurants, isLoading, fetchRestaurants } = useRestaurantStore()

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  if (isLoading) {
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurantes</h1>
          <p className="text-muted-foreground">Administración de restaurantes registrados</p>
        </div>
        <DataTable columns={columns} data={restaurants} searchKey="name" searchPlaceholder="Buscar por nombre..." />
      </div>
    </DashboardLayout>
  )
}
