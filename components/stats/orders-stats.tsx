"use client"
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { OrdersStats } from "@/lib/types"
import { ChartTooltipContent, ChartLegendContent, ChartContainer } from "@/components/ui/chart"

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--destructive))",
  "hsl(var(--muted))",
]

export function OrdersStatsCard({ data }: { data: OrdersStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{data.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.completed}</div>
            <div className="text-sm text-muted-foreground">Completados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.pending}</div>
            <div className="text-sm text-muted-foreground">Pendientes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.canceled}</div>
            <div className="text-sm text-muted-foreground">Cancelados</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{data.totalRevenue.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Ingresos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{(data.completionRate * 100).toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Tasa de conversión</div>
          </div>
        </div>
        {data.perDay.length > 0 ? (
          <ChartContainer id="orders-bar" config={{}} className="h-64">
            <BarChart data={data.perDay}>
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
              <ChartTooltipContent />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No hay datos de los últimos días.</p>
        )}
        {data.perDay30 && data.perDay30.length > 0 && (
          <ChartContainer id="orders-line" config={{}} className="h-64">
            <LineChart data={data.perDay30}>
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" />
              <ChartTooltipContent />
            </LineChart>
          </ChartContainer>
        )}
        {data.paymentMethods.length > 0 ? (
          <ChartContainer id="payment-pie" config={{}} className="h-64">
            <PieChart>
              <Pie data={data.paymentMethods} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {data.paymentMethods.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltipContent />
              <ChartLegendContent />
            </PieChart>
          </ChartContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No hay datos de métodos de pago.</p>
        )}
      </CardContent>
    </Card>
  )
}
