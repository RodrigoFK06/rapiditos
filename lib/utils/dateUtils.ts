import { Timestamp } from "firebase/firestore"

/**
 * 🛡️ Utilidades seguras para fechas - Previenen RangeError
 */

/**
 * Convierte de manera segura un valor a Date
 * @param value - Valor que puede ser Date, Timestamp, string o null/undefined
 * @returns Date válida o null
 */
export function safeToDate(value: unknown): Date | null {
  try {
    // Null/undefined
    if (value == null) return null
    
    // Ya es Date válida
    if (value instanceof Date) {
      return isValidDate(value) ? value : null
    }
    
    // Timestamp de Firestore
    if (value instanceof Timestamp) {
      return value.toDate()
    }
    
    // String ISO o timestamp numérico
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value)
      return isValidDate(date) ? date : null
    }
    
    // Objeto con propiedades de fecha (posible Firestore)
    if (typeof value === 'object' && value !== null) {
      // Firestore Timestamp-like object
      if ('seconds' in value && typeof value.seconds === 'number') {
        const timestamp = value as { seconds: number; nanoseconds?: number }
        const date = new Date(timestamp.seconds * 1000)
        return isValidDate(date) ? date : null
      }
      
      // Objeto con toDate method
      if ('toDate' in value && typeof value.toDate === 'function') {
        try {
          const date = value.toDate()
          return isValidDate(date) ? date : null
        } catch {
          return null
        }
      }
    }
    
    return null
  } catch (error) {
    console.warn('Error parsing date:', value, error)
    return null
  }
}

/**
 * Verifica si una Date es válida
 */
function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Formatea fecha de manera segura
 * @param value - Valor a formatear
 * @param options - Opciones de formato
 * @returns String formateado o fallback
 */
export function safeDateFormat(
  value: unknown, 
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  },
  locale: string = 'es-PE',
  fallback: string = 'N/A'
): string {
  const date = safeToDate(value)
  
  if (!date) return fallback
  
  try {
    return new Intl.DateTimeFormat(locale, options).format(date)
  } catch (error) {
    console.warn('Error formatting date:', date, error)
    return fallback
  }
}

/**
 * Formatea fecha relativa (hace X tiempo)
 */
export function safeRelativeTime(
  value: unknown,
  locale: string = 'es',
  fallback: string = 'Desconocido'
): string {
  const date = safeToDate(value)
  
  if (!date) return fallback
  
  try {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        return diffMinutes <= 1 ? 'Hace un momento' : `Hace ${diffMinutes} minutos`
      }
      return diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`
    }
    
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} días`
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`
    
    return `Hace ${Math.floor(diffDays / 365)} años`
  } catch (error) {
    console.warn('Error calculating relative time:', date, error)
    return fallback
  }
}

/**
 * Fecha corta solo (sin hora)
 */
export function safeDateOnly(value: unknown, fallback: string = '-'): string {
  return safeDateFormat(value, {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit'
  }, 'es-PE', fallback)
}

/**
 * Solo hora
 */
export function safeTimeOnly(value: unknown, fallback: string = '-'): string {
  return safeDateFormat(value, {
    hour: '2-digit',
    minute: '2-digit'
  }, 'es-PE', fallback)
}

// Tipos para TypeScript
export type DateLike = Date | Timestamp | string | number | null | undefined
export type DateFormatOptions = Intl.DateTimeFormatOptions
