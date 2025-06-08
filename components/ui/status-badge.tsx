import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case "Nuevo":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "Preparando":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "Enviando":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100"
      case "Completado":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  return <Badge className={cn(getStatusColor(), className)}>{status}</Badge>
}
