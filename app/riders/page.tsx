"use client"

import { useEffect } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { useRiderStore } from "@/lib/stores/useRiderStore"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Eye } from "lucide-react"
import type { Rider } from "@/lib/types"

const columns: ColumnDef<Rider>[] = [
  {
    accessorKey: "display_name",
    header: "Nombre",
    cell: ({ row }) => <div className="font-medium">{row.getValue("display_name")}</div>,
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
  },
  {
    accessorKey: "user_name",
    header: "Usuario",
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
      const rider = row.original
      return (
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/riders/${rider.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      )
    },
  },
]

export default function RidersPage() {
  const { riders, isLoading, fetchRiders } = useRiderStore()

  useEffect(() => {
    fetchRiders()
  }, [fetchRiders])

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
          <h1 className="text-3xl font-bold tracking-tight">Repartidores</h1>
          <p className="text-muted-foreground">Lista de repartidores registrados</p>
        </div>
        <DataTable columns={columns} data={riders} searchKey="display_name" searchPlaceholder="Buscar por nombre..." />
      </div>
    </DashboardLayout>
  )
}
