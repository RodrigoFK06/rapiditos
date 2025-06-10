"use client"
import { BarChart, Bar, XAxis, YAxis } from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { TopDish } from "@/lib/types"
import { ChartTooltipContent, ChartContainer } from "@/components/ui/chart"

export function TopDishesCard({ dishes }: { dishes: TopDish[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platillos más vendidos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dishes.length > 0 ? (
          <ChartContainer id="top-dishes" config={{}} className="h-64">
            <BarChart data={dishes} layout="vertical" margin={{ left: 32 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={100} />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
              <ChartTooltipContent />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No hay datos de platillos.</p>
        )}
        {dishes.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Ingresos totales: {dishes.reduce((sum, d) => sum + (d.revenue || 0), 0).toFixed(2)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
