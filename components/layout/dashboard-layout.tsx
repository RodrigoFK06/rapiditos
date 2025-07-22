"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/useAuthStore"
import { Sidebar } from "./sidebar"
import { Loader2 } from "lucide-react"
import { ErrorBoundary, DataErrorBoundary } from "@/components/ui/error-boundary"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading, isAdmin, firebaseUser } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !firebaseUser) {
      router.push("/login")
    } else if (!isLoading && !isAdmin) {
      router.push("/unauthorized")
    }
  }, [isLoading, isAdmin, firebaseUser, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!firebaseUser || !isAdmin) {
    return null
  }

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <main className="container mx-auto py-6">
            <DataErrorBoundary>
              {children}
            </DataErrorBoundary>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
