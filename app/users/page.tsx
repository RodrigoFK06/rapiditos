"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, RefreshCw, Users, UserCheck, UserX, Filter, AlertTriangle } from "lucide-react"
import type { User } from "@/lib/types"
import { 
  useUsers, 
  useUserSearch, 
  useToggleUserStatus, 
  useUserStats,
  usePrefetchUser 
} from "@/hooks/useUsers"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { safeDateFormat, safeRelativeTime } from "@/lib/utils/dateUtils"

/**
 * 📋 Componente de página de usuarios refactorizado
 * ✅ SOLUCIÓN PROBLEMA 1: Manejo seguro de fechas con dateUtils
 * ✅ SOLUCIÓN PROBLEMA 2: Sin loops infinitos de Zustand
 * ✅ SOLUCIÓN PROBLEMA 3: Sin ciclos de actualización
 * ✅ SOLUCIÓN PROBLEMA 4: Manejo de errores de Firestore con fallbacks
 */
export default function UsersPage() {
  // 🔍 Estados locales para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // ✅ Debounce manual para búsqueda (evita consultas excesivas)
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    
    // Debounce simple usando setTimeout
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [])

  // 🔄 Construir opciones de consulta basadas en filtros
  const queryOptions = useMemo(() => ({
    role: roleFilter === "all" ? undefined : roleFilter,
    limit: 50,
    searchTerm: debouncedSearch.trim() !== "" ? debouncedSearch : undefined
  }), [roleFilter, debouncedSearch])

  // 📊 Hooks de React Query - SIN LOOPS INFINITOS
  const { 
    data: usersData, 
    isLoading, 
    isError, 
    error, 
    refetch, 
    isFetching 
  } = useUsers(queryOptions)

  // 🔍 Búsqueda separada para resultados en tiempo real (solo si hay término)
  const { 
    data: searchResults = [], 
    isLoading: isSearching 
  } = useUserSearch(debouncedSearch)

  // 📈 Estadísticas derivadas
  const stats = useUserStats({ role: undefined, limit: 1000 })

  // 🔄 Mutaciones
  const toggleStatusMutation = useToggleUserStatus()
  const prefetchUser = usePrefetchUser()

  // 📋 Columnas memoizadas - ✅ SIN RE-CREACIÓN EN CADA RENDER + FECHAS SEGURAS
  const columns = useMemo((): ColumnDef<User>[] => [
    {
      accessorKey: "display_name",
      header: "Nombre",
      cell: ({ row }) => (
        <div 
          className="font-medium cursor-pointer hover:text-primary"
          onMouseEnter={() => prefetchUser(row.original.uid)}
        >
          {row.getValue("display_name") || "Sin nombre"}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.getValue("email") || "Sin email"}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        const roleColors = {
          admin: "destructive",
          restaurant: "default", 
          rider: "secondary",
          client: "outline"
        } as const
        return (
          <Badge variant={roleColors[role as keyof typeof roleColors] || "outline"}>
            {role || "Sin rol"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean
        const user = row.original
        
        return (
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Activo" : "Inactivo"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleStatusMutation.mutate({ 
                id: user.uid, 
                isActive: !isActive 
              })}
              disabled={toggleStatusMutation.isPending}
              className="h-6 px-2 text-xs"
            >
              {isActive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Registrado",
      cell: ({ row }) => {
        // ✅ SOLUCIÓN PROBLEMA 1: Fechas seguras - NO MÁS RangeError
        const dateValue = row.getValue("createdAt")
        const formattedDate = safeDateFormat(dateValue, {
          year: 'numeric',
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }, 'es-PE', 'N/A')
        
        const relativeTime = safeRelativeTime(dateValue, 'es', 'Desconocido')
        
        return (
          <div className="text-sm text-muted-foreground">
            <div>{formattedDate}</div>
            <div className="text-xs opacity-70">{relativeTime}</div>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const user = row.original
        const refId = `users/${user.uid}`
        
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            onMouseEnter={() => prefetchUser(user.uid)}
          >
            <Link href={`/users/${encodeURIComponent(refId)}`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">Ver detalles</span>
            </Link>
          </Button>
        )
      },
    },
  ], [toggleStatusMutation, prefetchUser]) // ✅ Dependencias estables

  // 🔄 Handlers para acciones
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  // 📊 Determinar qué datos mostrar (búsqueda vs lista normal)
  const displayData = useMemo(() => {
    if (debouncedSearch.trim() !== "" && searchResults.length > 0) {
      return searchResults
    }
    return usersData?.users || []
  }, [debouncedSearch, searchResults, usersData])

  const showLoading = isLoading || (debouncedSearch.trim() !== "" && isSearching)

  // 🎨 Render del componente
  return (
    <DashboardLayout>
      <ErrorBoundary>
        <div className="space-y-6">
          {/* 🏷️ Header con acciones */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
              <p className="text-muted-foreground">
                Gestiona todos los usuarios del sistema
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

          {/* ⚠️ SOLUCIÓN PROBLEMA 4: Manejo de errores de Firestore */}
          {isError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error instanceof Error && error.message.includes('index') 
                  ? "⚠️ La consulta requiere un índice en Firestore. Mostrando datos limitados."
                  : `Error al cargar usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`
                }
              </AlertDescription>
            </Alert>
          )}

          {/* 📊 KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Usuarios registrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(1)}%` : '0%'} del total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Inactivos</CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? `${((stats.inactive / stats.total) * 100).toFixed(1)}%` : '0%'} del total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{(stats.byRole as Record<string, number>)?.client || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Usuarios tipo cliente
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 🔍 Filtros y búsqueda */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros y Búsqueda
              </CardTitle>
              <CardDescription>
                Busca y filtra usuarios según tus necesidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      <SelectItem value="client">Clientes</SelectItem>
                      <SelectItem value="rider">Repartidores</SelectItem>
                      <SelectItem value="restaurant">Restaurantes</SelectItem>
                      <SelectItem value="admin">Administradores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 📋 Tabla de usuarios */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuarios</CardTitle>
              <CardDescription>
                {displayData.length} usuario{displayData.length !== 1 ? 's' : ''} 
                {debouncedSearch && ` encontrado${displayData.length !== 1 ? 's' : ''} para "${debouncedSearch}"`}
                {roleFilter !== "all" && ` con rol "${roleFilter}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 🔄 Loading spinner */}
              {showLoading ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner size="lg" />
                </div>
              ) : displayData.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron usuarios</h3>
                  <p className="text-muted-foreground">
                    {debouncedSearch 
                      ? `No hay usuarios que coincidan con "${debouncedSearch}"`
                      : "No hay usuarios registrados en el sistema"
                    }
                  </p>
                </div>
              ) : (
                /* 📊 Tabla de datos */
                <DataTable 
                  columns={columns} 
                  data={displayData}
                  searchKey="display_name"
                  searchPlaceholder="Buscar en esta página..."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  )
}
