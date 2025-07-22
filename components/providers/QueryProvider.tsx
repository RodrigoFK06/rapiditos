"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Tiempo que los datos permanecen "frescos"
            staleTime: 5 * 60 * 1000, // 5 minutos
            // Tiempo que los datos permanecen en caché
            gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
            // Reintentar en caso de error
            retry: (failureCount, error: any) => {
              // No reintentar para errores 4xx
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              // Reintentar hasta 3 veces para otros errores
              return failureCount < 3
            },
            // Tiempo entre reintentos
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch al enfocar la ventana
            refetchOnWindowFocus: false,
            // Refetch al reconectar
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )} */}
    </QueryClientProvider>
  )
}
