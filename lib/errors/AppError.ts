// Tipos de errores de la aplicación
export enum ErrorCode {
  // Errores de autenticación
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  
  // Errores de Firebase
  FIREBASE_NETWORK_ERROR = 'FIREBASE_NETWORK_ERROR',
  FIREBASE_PERMISSION_DENIED = 'FIREBASE_PERMISSION_DENIED',
  FIREBASE_DOCUMENT_NOT_FOUND = 'FIREBASE_DOCUMENT_NOT_FOUND',
  
  // Errores de validación
  VALIDATION_INVALID_DATA = 'VALIDATION_INVALID_DATA',
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  
  // Errores de negocio
  BUSINESS_OPERATION_NOT_ALLOWED = 'BUSINESS_OPERATION_NOT_ALLOWED',
  BUSINESS_RESOURCE_NOT_FOUND = 'BUSINESS_RESOURCE_NOT_FOUND',
  
  // Errores genéricos
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Severidad del error
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Clase base para errores de la aplicación
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly severity: ErrorSeverity
  public readonly statusCode: number
  public readonly context?: Record<string, any>
  public readonly timestamp: Date
  public readonly userMessage: string

  constructor(
    code: ErrorCode,
    message: string,
    userMessage?: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode: number = 500,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.severity = severity
    this.statusCode = statusCode
    this.context = context
    this.timestamp = new Date()
    this.userMessage = userMessage || this.getDefaultUserMessage(code)
  }

  private getDefaultUserMessage(code: ErrorCode): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Credenciales incorrectas',
      [ErrorCode.AUTH_USER_NOT_FOUND]: 'Usuario no encontrado',
      [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 'No tienes permisos para esta acción',
      [ErrorCode.FIREBASE_NETWORK_ERROR]: 'Error de conexión. Verifica tu internet',
      [ErrorCode.FIREBASE_PERMISSION_DENIED]: 'Acceso denegado a los datos',
      [ErrorCode.FIREBASE_DOCUMENT_NOT_FOUND]: 'El documento solicitado no existe',
      [ErrorCode.VALIDATION_INVALID_DATA]: 'Los datos proporcionados no son válidos',
      [ErrorCode.VALIDATION_REQUIRED_FIELD]: 'Faltan campos requeridos',
      [ErrorCode.BUSINESS_OPERATION_NOT_ALLOWED]: 'Operación no permitida',
      [ErrorCode.BUSINESS_RESOURCE_NOT_FOUND]: 'Recurso no encontrado',
      [ErrorCode.INTERNAL_ERROR]: 'Error interno del sistema',
      [ErrorCode.NETWORK_ERROR]: 'Error de red',
      [ErrorCode.UNKNOWN_ERROR]: 'Ha ocurrido un error inesperado'
    }
    return messages[code] || 'Error desconocido'
  }

  public toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    }
  }
}

// Errores específicos para diferentes contextos
export class AuthError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    userMessage?: string,
    context?: Record<string, any>
  ) {
    super(code, message, userMessage, ErrorSeverity.HIGH, 401, context)
    this.name = 'AuthError'
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    field?: string,
    receivedValue?: any,
    userMessage?: string
  ) {
    const context = field ? { field, receivedValue } : undefined
    super(
      ErrorCode.VALIDATION_INVALID_DATA,
      message,
      userMessage,
      ErrorSeverity.LOW,
      400,
      context
    )
    this.name = 'ValidationError'
  }
}

export class BusinessError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    userMessage?: string,
    context?: Record<string, any>
  ) {
    super(code, message, userMessage, ErrorSeverity.MEDIUM, 422, context)
    this.name = 'BusinessError'
  }
}

// Handler central de errores
export class ErrorHandler {
  private static instance: ErrorHandler
  private loggers: Array<(error: AppError) => void> = []

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  public addLogger(logger: (error: AppError) => void) {
    this.loggers.push(logger)
  }

  public handle(error: unknown): AppError {
    const appError = this.normalizeError(error)
    
    // Log el error
    this.loggers.forEach(logger => {
      try {
        logger(appError)
      } catch (logError) {
        console.error('Error in logger:', logError)
      }
    })

    return appError
  }

  private normalizeError(error: unknown): AppError {
    // Si ya es un AppError, devolverlo tal como está
    if (error instanceof AppError) {
      return error
    }

    // Errores de Firebase
    if (this.isFirebaseError(error)) {
      return this.handleFirebaseError(error)
    }

    // Errores de red
    if (this.isNetworkError(error)) {
      return new AppError(
        ErrorCode.NETWORK_ERROR,
        'Network request failed',
        'Error de conexión. Verifica tu internet.',
        ErrorSeverity.MEDIUM
      )
    }

    // Error genérico
    if (error instanceof Error) {
      return new AppError(
        ErrorCode.UNKNOWN_ERROR,
        error.message,
        'Ha ocurrido un error inesperado',
        ErrorSeverity.MEDIUM,
        500,
        { originalError: error.name }
      )
    }

    // Error desconocido
    return new AppError(
      ErrorCode.UNKNOWN_ERROR,
      'Unknown error occurred',
      'Ha ocurrido un error inesperado',
      ErrorSeverity.MEDIUM
    )
  }

  private isFirebaseError(error: any): boolean {
    return error?.code && typeof error.code === 'string' && error.code.startsWith('auth/') ||
           error?.code?.startsWith('firestore/') ||
           error?.code?.startsWith('permission-denied')
  }

  private handleFirebaseError(error: any): AppError {
    const firebaseCode = error.code

    // Mapear códigos de Firebase a nuestros códigos
    const codeMapping: Record<string, ErrorCode> = {
      'auth/user-not-found': ErrorCode.AUTH_USER_NOT_FOUND,
      'auth/wrong-password': ErrorCode.AUTH_INVALID_CREDENTIALS,
      'auth/invalid-credential': ErrorCode.AUTH_INVALID_CREDENTIALS,
      'permission-denied': ErrorCode.FIREBASE_PERMISSION_DENIED,
      'not-found': ErrorCode.FIREBASE_DOCUMENT_NOT_FOUND,
      'unavailable': ErrorCode.FIREBASE_NETWORK_ERROR,
    }

    const appErrorCode = codeMapping[firebaseCode] || ErrorCode.FIREBASE_NETWORK_ERROR
    
    return new AppError(
      appErrorCode,
      error.message || 'Firebase error',
      undefined,
      ErrorSeverity.HIGH,
      500,
      { firebaseCode }
    )
  }

  private isNetworkError(error: any): boolean {
    return error?.name === 'NetworkError' ||
           error?.code === 'NETWORK_ERROR' ||
           (error?.message && error.message.includes('fetch'))
  }
}

// Loggers
export const consoleLogger = (error: AppError) => {
  const logLevel = error.severity === ErrorSeverity.CRITICAL ? 'error' :
                   error.severity === ErrorSeverity.HIGH ? 'error' :
                   error.severity === ErrorSeverity.MEDIUM ? 'warn' : 'info'
  
  console[logLevel](`[${error.code}] ${error.message}`, {
    userMessage: error.userMessage,
    context: error.context,
    timestamp: error.timestamp
  })
}

// Logger para servicios externos (Sentry, etc.)
export const externalLogger = (error: AppError) => {
  // Aquí podrías enviar a Sentry, LogRocket, etc.
  if (typeof window !== 'undefined' && error.severity === ErrorSeverity.CRITICAL) {
    // Enviar solo errores críticos en producción
    console.error('Critical error for external logging:', error.toJSON())
  }
}

// Instancia global del manejador de errores
export const errorHandler = ErrorHandler.getInstance()

// Configurar loggers por defecto
errorHandler.addLogger(consoleLogger)
if (process.env.NODE_ENV === 'production') {
  errorHandler.addLogger(externalLogger)
}

// Utilidades de conveniencia
export const throwAuthError = (message: string, context?: Record<string, any>) => {
  throw new AuthError(ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, message, undefined, context)
}

export const throwValidationError = (message: string, field?: string, receivedValue?: any) => {
  throw new ValidationError(message, field, receivedValue)
}

export const throwBusinessError = (message: string, userMessage?: string, context?: Record<string, any>) => {
  throw new BusinessError(ErrorCode.BUSINESS_OPERATION_NOT_ALLOWED, message, userMessage, context)
}
