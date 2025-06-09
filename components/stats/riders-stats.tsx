"use client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { RidersStats } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

export function RidersStatsCard({ data }: { data: RidersStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Repartidores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{data.totalActive}</div>
            <div className="text-sm text-muted-foreground">Activos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.totalDeliveries}</div>
            <div className="text-sm text-muted-foreground">Entregas</div>
          </div>
        </div>
        {data.topRiders.length > 0 ? (
          <div className="space-y-2">
            {data.topRiders.map((r) => (
              <div key={r.id} className="flex justify-between">
                <span className="text-sm">{r.display_name}</span>
                <Badge variant="outline">{r.count}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay datos de repartidores.</p>
        )}
      </CardContent>
    </Card>
  )
}
