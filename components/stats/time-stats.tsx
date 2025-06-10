"use client"
import { LineChart, Line, XAxis, YAxis } from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { TimeStats } from "@/lib/types"
import { ChartTooltipContent, ChartContainer } from "@/components/ui/chart"

export function TimeStatsCard({ data }: { data: TimeStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tiempos de entrega</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.perDay.length > 0 ? (
          <ChartContainer id="time-line" config={{}} className="h-64">
            <LineChart data={data.perDay}>
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" />
              <ChartTooltipContent />
            </LineChart>
          </ChartContainer>
        ) : (
          <p className="text-sm text-muted-foreground">Sin datos recientes.</p>
        )}
      </CardContent>
    </Card>
  )
}
