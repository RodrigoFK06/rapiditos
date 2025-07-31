import { z } from "zod"
import { Timestamp } from "firebase/firestore"

// Transformador para fechas de Firebase
const firebaseTimestamp = z.union([
  z.instanceof(Timestamp).transform(ts => ts.toDate()),
  z.date(),
  z.string().transform(str => new Date(str))
])

// Schema base para User
export const userSchema = z.object({
  uid: z.string(),
  display_name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  photo_url: z.string().url().optional().or(z.literal("")),
  role: z.enum(["client", "rider", "restaurant", "admin"]),
  isActive: z.boolean(),
  createdAt: firebaseTimestamp.optional(),
  // Referencias opcionales
  address: z.any().optional(), // DocumentReference
  rider_ref: z.any().optional(), // DocumentReference
})

// Schema para Restaurant
export const restaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  addressText: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  restaurantPhone: z.string().optional(),
  restaurantEmail: z.string().email().optional().or(z.literal("")),
  webSite: z.string().url().optional().or(z.literal("")),
  managerName: z.string().optional(),
  managerLastName: z.string().optional(),
  reference_place: z.string().optional(),
  yearFundation: z.number().optional(),
  isActive: z.boolean().optional(),
  doc_ruc_url: z.string().optional(),
  doc_id_url: z.string().optional(),
  doc_license_url: z.string().optional(),
})

// Schema para Rider
export const riderSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  phone: z.string(),
  photo_url: z.string().optional(),
  user_name: z.string(),
  user_ref: z.any(), // DocumentReference
  active_rider: z.boolean(),
  active_orders: z.number().optional(),
  number_deliverys: z.number().optional(),
})

// Schema para Order
export const orderSchema = z.object({
  id: z.string(),
  estado: z.enum(["Nuevo", "Preparando", "Enviando", "Completado"]),
  total: z.number().optional(),
  fecha_creacion: firebaseTimestamp.optional(),
  fecha_entrega: firebaseTimestamp.optional(),
  activo: z.boolean().optional(),
  cliente_ref: z.any().optional(), // DocumentReference
  restaurantref: z.any().optional(), // DocumentReference
  payment_method: z.string().optional(),
})

// Tipos inferidos
export type ValidatedUser = z.infer<typeof userSchema>
export type ValidatedRestaurant = z.infer<typeof restaurantSchema>
export type ValidatedRider = z.infer<typeof riderSchema>
export type ValidatedOrder = z.infer<typeof orderSchema>

// Clase para errores de validación
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public receivedValue: unknown
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Utilidades de validación
export const validateUser = (data: unknown): ValidatedUser => {
  try {
    return userSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      throw new ValidationError(
        `Error validando usuario: ${firstError.message}`,
        firstError.path.join('.'),
        'received' in firstError ? firstError.received : 'unknown'
      )
    }
    throw error
  }
}

export const validateRestaurant = (data: unknown): ValidatedRestaurant => {
  try {
    return restaurantSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      throw new ValidationError(
        `Error validando restaurante: ${firstError.message}`,
        firstError.path.join('.'),
        'received' in firstError ? firstError.received : 'unknown'
      )
    }
    throw error
  }
}

export const validateRider = (data: unknown): ValidatedRider => {
  try {
    return riderSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      throw new ValidationError(
        `Error validando repartidor: ${firstError.message}`,
        firstError.path.join('.'),
        'received' in firstError ? firstError.received : 'unknown'
      )
    }
    throw error
  }
}

export const validateOrder = (data: unknown): ValidatedOrder => {
  try {
    return orderSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      throw new ValidationError(
        `Error validando pedido: ${firstError.message}`,
        firstError.path.join('.'),
        'received' in firstError ? firstError.received : 'unknown'
      )
    }
    throw error
  }
}

// Validador genérico para arrays
export const validateArray = <T>(
  data: unknown[],
  validator: (item: unknown) => T,
  context = 'elemento'
): T[] => {
  const results: T[] = []
  const errors: Array<{ index: number; error: Error }> = []

  data.forEach((item, index) => {
    try {
      results.push(validator(item))
    } catch (error) {
      errors.push({ 
        index, 
        error: error instanceof Error ? error : new Error('Error desconocido') 
      })
    }
  })

  if (errors.length > 0) {
    console.warn(`Errores de validación en ${context}:`, errors)
    // En desarrollo, podrías lanzar el error. En producción, filtrar elementos inválidos
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`${errors.length} errores de validación en ${context}`)
    }
  }

  return results
}

// Safe parsers que no lanzan errores
export const safeParseUser = (data: unknown) => userSchema.safeParse(data)
export const safeParseRestaurant = (data: unknown) => restaurantSchema.safeParse(data)
export const safeParseRider = (data: unknown) => riderSchema.safeParse(data)
export const safeParseOrder = (data: unknown) => orderSchema.safeParse(data)

// Schema para ExchangeRate - validación runtime
export const exchangeRateRuntimeSchema = z.object({
  id: z.string(),
  base_currency: z.string().min(3, "Código de moneda base requerido"),
  target_currency: z.string().min(3, "Código de moneda objetivo requerido"),
  rate: z.number().positive("La tasa debe ser positiva"),
  created_at: firebaseTimestamp
})

export const safeParseExchangeRate = (data: unknown) => exchangeRateRuntimeSchema.safeParse(data)
