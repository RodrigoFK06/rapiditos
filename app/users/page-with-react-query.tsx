"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useUsers, useUpdateUser, useToggleUserStatus, useUserSearch } from "@/hooks/queries/useUserQueries"
import { useUserColumns } from "@/lib/table/columns"
import { RefreshCw, Search } from "lucide-react"

export default function UsersPageWithReactQuery() {
  const [searchTerm, setSearchTerm] = useState("")
  
  // Usar React Query en lugar de Zustand para datos del servidor
  const { 
    data: users = [], 
    isLoading, 
    isError, 
    error, 
    refetch, 
    isFetching 
  } = useUsers()

  // Búsqueda con debounce
  const { 
    data: searchResults = [], 
    isLoading: isSearching 
  } = useUserSearch(searchTerm)

  // Mutations
  const updateUserMutation = useUpdateUser()
  const toggleStatusMutation = useToggleUserStatus()

  // Columnas memoizadas
  const columns = useUserColumns()

  // Determinar qué datos mostrar
  const displayData = searchTerm.length >= 2 ? searchResults : users
  const showLoading = isLoading || (searchTerm.length >= 2 && isSearching)

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ 
      id, 
      isActive: !currentStatus 
    })
  }

  const handleRefresh = () => {
    refetch()
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
          
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof Error ? error.message : 'Error al cargar usuarios'}
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
            <p className="text-muted-foreground">
              Gestión de usuarios del sistema
              {isFetching && (
                <Badge variant="outline" className="ml-2">
                  <LoadingSpinner size="sm" className="mr-1" />
                  Actualizando...
                </Badge>
              )}
            </p>
          </div>
          
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Búsqueda */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSearchTerm("")}
            >
              Limpiar
            </Button>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-4 border">
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-sm text-muted-foreground">Total usuarios</div>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <div className="text-2xl font-bold">
              {users.filter(u => u.isActive).length}
            </div>
            <div className="text-sm text-muted-foreground">Activos</div>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'client').length}
            </div>
            <div className="text-sm text-muted-foreground">Clientes</div>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'rider').length}
            </div>
            <div className="text-sm text-muted-foreground">Repartidores</div>
          </div>
        </div>

        {/* Tabla */}
        {showLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={displayData}
            searchKey="display_name"
            searchPlaceholder="Buscar por nombre..."
          />
        )}

        {/* Estado de las mutaciones */}
        {(updateUserMutation.isPending || toggleStatusMutation.isPending) && (
          <div className="fixed bottom-4 right-4">
            <div className="bg-background border rounded-lg p-3 shadow-lg flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm">Guardando cambios...</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
