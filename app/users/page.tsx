"use client"

import { useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useUserStore } from "@/lib/stores/useUserStore"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { User } from "@/lib/types"

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "display_name",
    header: "Nombre",
    cell: ({ row }) => <div className="font-medium">{row.getValue("display_name")}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("role")}</Badge>,
  },
  {
    accessorKey: "isActive",
    header: "Activo",
    cell: ({ row }) => (
      <Badge variant={row.getValue("isActive") ? "default" : "secondary"}>{row.getValue("isActive") ? "Sí" : "No"}</Badge>
    ),
  },
]

export default function UsersPage() {
  const { users, isLoading, fetchUsers } = useUserStore()

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Listado completo de usuarios registrados</p>
        </div>
        <DataTable columns={columns} data={users} searchKey="display_name" searchPlaceholder="Buscar por nombre..." />
      </div>
    </DashboardLayout>
  )
}
