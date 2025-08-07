import { useMemo } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2 } from "lucide-react"
import type { User, Restaurant, Rider, Order, ExchangeRate } from "@/lib/types"
import { formatDate } from "@/lib/utils"

// Factory para columnas de usuarios
export const createUserColumns = (): ColumnDef<User>[] => [
  {
    accessorKey: "display_name",
    header: "Nombre",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("display_name")}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("role")}</Badge>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Activo",
    cell: ({ row }) => (
      <Badge variant={row.getValue("isActive") ? "default" : "secondary"}>
        {row.getValue("isActive") ? "Sí" : "No"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original
      const refId = `users/${user.uid}`
      return (
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/users/${encodeURIComponent(refId)}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      )
    },
  },
]

// Factory para columnas de restaurantes
export const createRestaurantColumns = (
  onEdit?: (restaurant: Restaurant) => void,
  onToggleStatus?: (id: string, isActive: boolean) => void
): ColumnDef<Restaurant>[] => [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
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
      <Badge variant={row.getValue("isActive") ? "default" : "secondary"}>
        {row.getValue("isActive") ? "Sí" : "No"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const restaurant = row.original
      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/restaurants/${restaurant.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {onEdit && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit(restaurant)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onToggleStatus && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleStatus(restaurant.id, !restaurant.isActive)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    },
  },
]

// Factory para columnas de riders
export const createRiderColumns = (): ColumnDef<Rider>[] => [
  {
    accessorKey: "display_name",
    header: "Nombre",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("display_name")}</div>
    ),
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
    accessorKey: "active_rider",
    header: "Activo",
    cell: ({ row }) => (
      <Badge variant={row.getValue("active_rider") ? "default" : "secondary"}>
        {row.getValue("active_rider") ? "Sí" : "No"}
      </Badge>
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

// Factory para columnas de órdenes
export const createOrderColumns = (): ColumnDef<Order>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      const id = row.getValue("id")
      const idString = typeof id === 'string' ? id : String(id || '')
      return (
        <div className="font-mono text-xs">{idString.slice(0, 8)}</div>
      )
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("estado") as string
      const variant = 
        status === "Completado" ? "default" :
        status === "Enviando" ? "secondary" :
        status === "Preparando" ? "outline" : "destructive"
      
      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      const amount = row.getValue("total") as number
      return (
        <div className="font-medium">
          $ {amount?.toFixed(2)}
        </div>
      )
    },
  },
  {
    accessorKey: "fecha_creacion",
    header: "Fecha",
    cell: ({ row }) => {
      const date = row.getValue("fecha_creacion") as Date
      return (
        <div className="text-sm">
          {date ? new Date(date).toLocaleDateString() : "-"}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original
      return (
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/orders/${order.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      )
    },
  },
]

// Factory para columnas de exchange rates
export const createExchangeRateColumns = (
  onEdit?: (exchangeRate: ExchangeRate) => void
): ColumnDef<ExchangeRate>[] => [
  {
    accessorKey: "base_currency",
    header: "Moneda Base",
    cell: ({ row }) => (
      <div className="font-medium">
        <Badge variant="outline" className="font-mono">
          {row.getValue("base_currency")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "target_currency", 
    header: "Moneda Objetivo",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.getValue("target_currency")}
      </Badge>
    ),
  },
  {
    accessorKey: "rate",
    header: "Tasa de Cambio",
    cell: ({ row }) => {
      const rate = row.getValue("rate") as number
      return (
        <div className="font-mono text-right">
          {rate.toLocaleString('en-US', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
          })}
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Fecha de Creación",
    cell: ({ row }) => {
      const date = row.getValue("created_at") as Date
      return (
        <div className="text-sm text-muted-foreground">
          {formatDate(date)}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const exchangeRate = row.original
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit?.(exchangeRate)}
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar tasa</span>
        </Button>
      )
    },
  },
]

// Hooks para usar las columnas memoizadas
export const useUserColumns = () => useMemo(() => createUserColumns(), [])

export const useRestaurantColumns = (
  onEdit?: (restaurant: Restaurant) => void,
  onToggleStatus?: (id: string, isActive: boolean) => void
) => useMemo(() => createRestaurantColumns(onEdit, onToggleStatus), [onEdit, onToggleStatus])

export const useRiderColumns = () => useMemo(() => createRiderColumns(), [])

export const useOrderColumns = () => useMemo(() => createOrderColumns(), [])

export const useExchangeRateColumns = (
  onEdit?: (exchangeRate: ExchangeRate) => void
) => useMemo(() => createExchangeRateColumns(onEdit), [onEdit])
