"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ArrowLeft } from "lucide-react"
import { useUserDetail } from "@/hooks/useUserDetail"

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const refId = decodeURIComponent(params.refId as string)

  const { user, isLoading, error, refetch } = useUserDetail(refId)

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Error</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <Button onClick={refetch} className="mt-4">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Usuario no encontrado</h1>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{user.display_name}</h1>
            <p className="text-muted-foreground">Detalle del usuario</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Rol:</span>
              <span className="text-sm">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Activo:</span>
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? "Sí" : "No"}
              </Badge>
            </div>
            {user.createdAt && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Registrado:</span>
                <span className="text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {user.address && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Dirección ref:</span>
                <span className="text-sm">{user.address.path}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
