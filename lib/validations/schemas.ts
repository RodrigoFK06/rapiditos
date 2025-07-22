import { z } from "zod"

// Schema de validación para Restaurant
export const restaurantSchema = z.object({
  name: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  
  description: z.string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(500, "La descripción no puede exceder 500 caracteres"),
  
  addressText: z.string()
    .min(10, "La dirección debe tener al menos 10 caracteres"),
  
  district: z.string()
    .min(2, "El distrito es requerido"),
  
  city: z.string()
    .min(2, "La ciudad es requerida"),
  
  category: z.string()
    .min(2, "La categoría es requerida"),
  
  restaurantPhone: z.string()
    .regex(/^\d{9}$/, "El teléfono debe tener 9 dígitos"),
  
  restaurantEmail: z.string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  
  webSite: z.string()
    .url("URL inválida")
    .optional()
    .or(z.literal("")),
  
  managerName: z.string()
    .min(2, "El nombre del encargado es requerido"),
  
  managerLastName: z.string()
    .min(2, "El apellido del encargado es requerido"),
  
  reference_place: z.string()
    .optional(),
  
  yearFundation: z.coerce.number()
    .min(1900, "Año de fundación inválido")
    .max(new Date().getFullYear(), "El año no puede ser futuro")
    .optional(),
  
  isActive: z.boolean().default(true),
  
  doc_ruc_url: z.string().optional(),
  doc_id_url: z.string().optional(),
  doc_license_url: z.string().optional()
})

export type RestaurantFormData = z.infer<typeof restaurantSchema>

// Schema para otros formularios
export const userSchema = z.object({
  display_name: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  
  email: z.string()
    .email("Email inválido"),
  
  phone: z.string()
    .regex(/^\d{9}$/, "El teléfono debe tener 9 dígitos"),
  
  role: z.enum(["client", "rider", "restaurant", "admin"]),
  
  isActive: z.boolean().default(true)
})

export type UserFormData = z.infer<typeof userSchema>

export const riderSchema = z.object({
  display_name: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  
  phone: z.string()
    .regex(/^\d{9}$/, "El teléfono debe tener 9 dígitos"),
  
  user_name: z.string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  
  active_rider: z.boolean().default(true),
  
  photo_url: z.string().url("URL de foto inválida").optional().or(z.literal(""))
})

export type RiderFormData = z.infer<typeof riderSchema>

// Schema de validación para ExchangeRate
export const exchangeRateSchema = z.object({
  rate: z.coerce.number()
    .positive("La tasa debe ser un número positivo")
    .min(0.01, "La tasa debe ser mayor a 0.01")
    .max(10000, "La tasa no puede exceder 10,000")
    .refine((val) => !isNaN(val) && isFinite(val), {
      message: "La tasa debe ser un número válido"
    })
})

// Schema para actualización de tasa (solo el campo rate)
export const updateExchangeRateSchema = z.object({
  id: z.string().min(1, "ID requerido"),
  rate: z.coerce.number()
    .positive("La tasa debe ser un número positivo")
    .min(0.01, "La tasa debe ser mayor a 0.01")
    .max(10000, "La tasa no puede exceder 10,000")
})

export type ExchangeRateFormData = z.infer<typeof exchangeRateSchema>
export type UpdateExchangeRateFormData = z.infer<typeof updateExchangeRateSchema>
