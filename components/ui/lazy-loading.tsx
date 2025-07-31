import React, { Suspense, lazy } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Componente de carga por defecto
export function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Cargando página...</p>
      </div>
    </div>
  )
}

// Skeleton para tablas
export function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Skeleton para cards
export function CardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton para estadísticas
export function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// HOC para lazy loading con fallback personalizado
export function withLazyLoading<P extends object>(
  componentImport: () => Promise<{ default: React.ComponentType<P> }>,
  fallback: React.ComponentType = PageLoadingFallback
) {
  const LazyComponent = lazy(componentImport)
  
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={React.createElement(fallback)}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Páginas lazy loaded
export const LazyUsersPage = withLazyLoading(
  () => import('@/app/users/page-with-react-query'),
  TableSkeleton
)

export const LazyOrdersPage = withLazyLoading(
  () => import('@/app/orders/page'),
  TableSkeleton
)

export const LazyRestaurantsPage = withLazyLoading(
  () => import('@/app/restaurants/page'),
  TableSkeleton
)

export const LazyRidersPage = withLazyLoading(
  () => import('@/app/riders/page'),
  TableSkeleton
)

export const LazyStatsPage = withLazyLoading(
  () => import('@/app/stats/page'),
  StatsSkeleton
)

// Componente para rutas con lazy loading
export function LazyRoute({ 
  component: Component, 
  fallback = PageLoadingFallback,
  ...props 
}: {
  component: React.ComponentType<any>
  fallback?: React.ComponentType
  [key: string]: any
}) {
  return (
    <Suspense fallback={fallback ? React.createElement(fallback) : <PageLoadingFallback />}>
      <Component {...props} />
    </Suspense>
  )
}

// Hook para preload de componentes
export function usePreloadComponent(
  componentImport: () => Promise<{ default: React.ComponentType<any> }>
) {
  return () => {
    // Precargar el componente
    componentImport()
  }
}

// Preloader para rutas críticas
export function preloadCriticalRoutes() {
  // Precargar rutas importantes en idle time
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Precargar páginas principales
      import('@/app/dashboard/page')
      import('@/app/users/page-with-react-query')
      import('@/app/orders/page')
    })
  }
}
