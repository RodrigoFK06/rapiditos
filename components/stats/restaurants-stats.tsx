"use client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { RestaurantsStats } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

export function RestaurantsStatsCard({ data }: { data: RestaurantsStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Restaurantes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{data.totalActive}</div>
          <div className="text-sm text-muted-foreground">Activos</div>
        </div>
        {data.topRestaurants.length > 0 ? (
          <div className="space-y-2">
            {data.topRestaurants.map((r) => (
              <div key={r.id} className="flex justify-between text-sm">
                <span>{r.name}</span>
                <span>
                  {r.orders} pedidos / ${r.revenue.toFixed(2)}
                  {r.topDish && <span className="ml-2 text-xs text-muted-foreground">{r.topDish}</span>}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay datos de restaurantes.</p>
        )}
      </CardContent>
    </Card>
  )
}
