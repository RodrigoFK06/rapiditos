"use client"

import React, { ErrorInfo, ReactNode, Component } from "react"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

/**
 * 🛡️ Error Boundary robusto para manejo de errores
 * ✅ SOLUCIÓN PROBLEMA: Captura todos los errores de React 
 * ✅ Previene crashes completos de la aplicación
 * ✅ Proporciona información útil para debugging
 * ✅ Permite recovery manual con reset
 */
export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null

  constructor(props: Props) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId()
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Actualiza el estado para que el siguiente renderizado muestre la UI de error
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log del error para debugging
    console.group(`🚨 Error Boundary Triggered [${this.state.errorId}]`)
    console.error("Error:", error)
    console.error("Error Info:", errorInfo)
    console.error("Component Stack:", errorInfo.componentStack)
    console.groupEnd()

    // Actualizar estado con información del error
    this.setState({
      error,
      errorInfo
    })

    // Callback opcional para reportar errores
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Enviar error a servicio de monitoreo (si está configurado)
    this.reportError(error, errorInfo)
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    // Reset automático si cambian las resetKeys
    if (hasError && resetKeys && resetKeys !== prevProps.resetKeys) {
      if (resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index])) {
        this.resetErrorBoundary()
      }
    }

    // Reset automático si cambian las props y está habilitado
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary()
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId)
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Aquí puedes enviar el error a un servicio como Sentry, LogRocket, etc.
    try {
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }

      // Ejemplo: enviar a analytics o logging service
      console.info("📊 Error Report Generated:", errorReport)
      
      // TODO: Integrar con servicio de monitoreo
      // analytics.track('error_boundary_triggered', errorReport)
    } catch (reportingError) {
      console.error("Failed to report error:", reportingError)
    }
  }

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId)
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: this.generateErrorId()
      })
    }, 100)
  }

  private handleRetry = () => {
    this.resetErrorBoundary()
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = "/"
  }

  private getErrorType(error: Error): string {
    if (error.message.includes("ChunkLoadError")) return "chunk-load"
    if (error.message.includes("Firebase")) return "firebase"
    if (error.message.includes("Network")) return "network"
    if (error.message.includes("RangeError")) return "range-error"
    if (error.message.includes("Maximum update depth")) return "infinite-loop"
    return "unknown"
  }

  private getErrorSeverity(error: Error): "low" | "medium" | "high" {
    const errorType = this.getErrorType(error)
    
    switch (errorType) {
      case "chunk-load":
      case "network":
        return "medium"
      case "firebase":
      case "infinite-loop":
        return "high"
      case "range-error":
        return "medium"
      default:
        return "low"
    }
  }

  private getErrorSuggestion(error: Error): string {
    const errorType = this.getErrorType(error)
    
    switch (errorType) {
      case "chunk-load":
        return "Error de carga de recursos. Intenta recargar la página."
      case "firebase":
        return "Error de base de datos. Verifica tu conexión a internet."
      case "network":
        return "Error de red. Revisa tu conexión a internet."
      case "range-error":
        return "Error de datos inválidos. Algunos valores pueden estar corruptos."
      case "infinite-loop":
        return "Error de actualización infinita. El componente necesita reiniciarse."
      default:
        return "Error inesperado. Intenta recargar o contacta soporte."
    }
  }

  render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, úsalo
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error } = this.state
      const errorType = error ? this.getErrorType(error) : "unknown"
      const severity = error ? this.getErrorSeverity(error) : "low"
      const suggestion = error ? this.getErrorSuggestion(error) : "Error desconocido"

      const severityColors = {
        low: "secondary",
        medium: "default", 
        high: "destructive"
      } as const

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-xl font-semibold">
                Algo salió mal
              </CardTitle>
              <CardDescription>
                Se produjo un error inesperado en esta sección de la aplicación
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* 🏷️ Error Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={severityColors[severity]}>
                    {severity === "high" ? "Crítico" : severity === "medium" ? "Moderado" : "Menor"}
                  </Badge>
                  <Badge variant="outline">{errorType}</Badge>
                  <span className="text-xs text-muted-foreground">
                    ID: {this.state.errorId}
                  </span>
                </div>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {suggestion}
                  </AlertDescription>
                </Alert>
              </div>

              {/* 🔧 Acciones de recuperación */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Intentar de nuevo
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recargar página
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Ir al inicio
                </Button>
              </div>

              {/* 🐛 Detalles técnicos (solo en desarrollo) */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium flex items-center gap-2 p-2 bg-muted rounded">
                    <Bug className="h-4 w-4" />
                    Detalles técnicos (desarrollo)
                  </summary>
                  <div className="mt-3 p-4 bg-muted/50 rounded-md">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm">Error:</h4>
                        <code className="text-xs text-destructive block mt-1 font-mono">
                          {error.message}
                        </code>
                      </div>
                      
                      {error.stack && (
                        <div>
                          <h4 className="font-medium text-sm">Stack Trace:</h4>
                          <pre className="text-xs text-muted-foreground mt-1 overflow-auto bg-background p-2 rounded border font-mono whitespace-pre-wrap">
                            {error.stack}
                          </pre>
                        </div>
                      )}
                      
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <h4 className="font-medium text-sm">Component Stack:</h4>
                          <pre className="text-xs text-muted-foreground mt-1 overflow-auto bg-background p-2 rounded border font-mono whitespace-pre-wrap">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 🎯 Hook para usar Error Boundary con manejo funcional
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ErrorBoundary

// 🛡️ Error Boundary específico para datos
export function DataErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Data loading error:', error)
        // Aquí puedes enviar a tu servicio de logging
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// 🚨 Error Boundary especializado para rutas (renombrado para evitar duplicación)
export function AppRouteErrorBoundary({ 
  children, 
  routeName 
}: { 
  children: ReactNode
  routeName: string 
}) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error(`Route Error [${routeName}]:`, error, errorInfo)
        // Aquí puedes enviar métricas específicas de ruta
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
