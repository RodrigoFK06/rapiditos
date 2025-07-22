"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, DollarSign } from "lucide-react"
import { EditExchangeRateModal } from "@/components/exchange-rate/edit-exchange-rate-modal"
import { useExchangeRates } from "@/hooks/queries/useExchangeRateQueries"
import { useExchangeRateColumns } from "@/lib/table/columns"
import { ExchangeRate } from "@/lib/types"
import { ErrorBoundary } from "@/components/ui/error-boundary"

export default function ExchangeRatesPage() {
  const [selectedExchangeRate, setSelectedExchangeRate] = useState<ExchangeRate | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Usar React Query para obtener datos
  const { 
    data: exchangeRates = [], 
    isLoading, 
    isError, 
    error, 
    refetch, 
    isFetching 
  } = useExchangeRates()

  // Columnas memoizadas con handler de edición
  const columns = useExchangeRateColumns((exchangeRate: ExchangeRate) => {
    setSelectedExchangeRate(exchangeRate)
    setIsEditModalOpen(true)
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setSelectedExchangeRate(null)
  }

  // Calcular estadísticas básicas
  const stats = {
    totalRates: exchangeRates.length,
    averageRate: exchangeRates.length > 0 
      ? (exchangeRates.reduce((sum, rate) => sum + rate.rate, 0) / exchangeRates.length)
      : 0,
    highestRate: exchangeRates.length > 0 
      ? Math.max(...exchangeRates.map(rate => rate.rate))
      : 0,
    lowestRate: exchangeRates.length > 0 
      ? Math.min(...exchangeRates.map(rate => rate.rate))
      : 0,
  }

  return (
    <DashboardLayout>
      <ErrorBoundary>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tasas de Cambio</h1>
              <p className="text-muted-foreground">
                Gestiona las tasas de cambio para las diferentes monedas
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isFetching}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Tasas</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRates}</div>
                <p className="text-xs text-muted-foreground">
                  Pares de monedas configurados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa Promedio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {stats.averageRate.toFixed(4)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Media de todas las tasas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa Más Alta</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-green-600">
                  {stats.highestRate.toFixed(4)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor máximo actual
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa Más Baja</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-blue-600">
                  {stats.lowestRate.toFixed(4)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor mínimo actual
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Tasas de Cambio</CardTitle>
              <CardDescription>
                Haz clic en el botón de editar para modificar la tasa de cambio.
                Solo se puede modificar el valor de la tasa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner size="lg" />
                </div>
              ) : isError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Error al cargar las tasas de cambio: {error?.message || "Error desconocido"}
                  </AlertDescription>
                </Alert>
              ) : exchangeRates.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay tasas de cambio</h3>
                  <p className="text-muted-foreground">
                    No se encontraron documentos en la colección exchange_rate.
                  </p>
                </div>
              ) : (
                <DataTable 
                  columns={columns} 
                  data={exchangeRates}
                  searchKey="base_currency"
                  searchPlaceholder="Buscar por moneda base..."
                />
              )}
            </CardContent>
          </Card>

          {/* Modal de Edición */}
          {selectedExchangeRate && (
            <EditExchangeRateModal
              open={isEditModalOpen}
              onOpenChange={handleCloseModal}
              exchangeRate={selectedExchangeRate}
            />
          )}
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  )
}
