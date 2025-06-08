"use client"

import { useEffect } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { useOrderStore } from "@/lib/stores/useOrderStore"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Eye, MoreHorizontal } from "lucide-react"
import type { Order } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "pedido_id",
    header: "ID Pedido",
    cell: ({ row }) => <div className="font-medium">#{row.getValue("pedido_id")}</div>,
  },
  {
    accessorKey: "cliente_nombre",
    header: "Cliente",
  },
  {
    accessorKey: "restaurante_nombre",
    header: "Restaurante",
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => <StatusBadge status={row.getValue("estado")} />,
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => <Badge variant="outline">{formatCurrency(row.getValue("total"))}</Badge>,
  },
  {
    accessorKey: "fecha_creacion",
    header: "Fecha",
    cell: ({ row }) => <div className="text-sm">{formatDate(row.getValue("fecha_creacion"))}</div>,
  },
  {
    accessorKey: "asigned",
    header: "Asignado",
    cell: ({ row }) => (
      <Badge variant={row.getValue("asigned") ? "default" : "secondary"}>{row.getValue("asigned") ? "Sí" : "No"}</Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/orders/${order.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(order.id)}>Copiar ID</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function OrdersPage() {
  const { orders, isLoading, fetchOrders } = useOrderStore()

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
            <p className="text-muted-foreground">Gestiona todos los pedidos de la plataforma</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={orders}
          searchKey="cliente_nombre"
          searchPlaceholder="Buscar por cliente..."
        />
      </div>
    </DashboardLayout>
  )
}
