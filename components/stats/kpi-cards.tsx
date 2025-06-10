"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardKpis } from "@/lib/types"

export function KpiCards({ data }: { data: DashboardKpis }) {
  const items = [
    { label: "Ingresos hoy", value: data.incomeToday },
    { label: "Ingresos semana", value: data.incomeWeek },
    { label: "Ingresos mes", value: data.incomeMonth },
    { label: "Nuevos usuarios", value: data.newUsersToday },
    { label: "Conversión", value: `${(data.conversionRate * 100).toFixed(1)}%` },
    { label: "Entrega promedio", value: `${data.avgDeliveryMinutes.toFixed(1)} min` },
  ]
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {items.map((it) => (
        <Card key={it.label}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{it.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof it.value === "number" && it.label.includes("Ingreso")
                ? `S/.${(it.value as number).toFixed(2)}`
                : it.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
